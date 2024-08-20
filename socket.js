import uWS from 'uWebSockets.js';
import EventEmitter from 'events';
import { randomUUID } from 'crypto';
import { ORIGIN_URL, API_PATH, WS_PORT, WS_IDLE_TIMEOUT } from './config/config.js';
import jwtVerify from './helpers/jwtVerify.js';
import ErrorObject from './helpers/errorObject.js';
import StorageServer from './models/storageServer.js';
import Request from './helpers/request.js';
import logger from './helpers/logger.js';

export default class Socket {
  static #sockets = new Map();
  static #eventEmitter = new EventEmitter();
  static #decoder = new TextDecoder('utf-8');

  static init() {
    /* setInterval(() => console.log(this.#sockets), 2000); */
    uWS
      .App()
      .listen(+WS_PORT, (token) =>
        token
          ? logger.info(`uWebSockets Server started on port ${WS_PORT}`)
          : logger.error('Failed to start server')
      )
      .ws(`${API_PATH}.uws/clients`, {
        idleTimeout: WS_IDLE_TIMEOUT,
        upgrade: (res, req, context) => {
          try {
            if (req.getHeader('origin') !== ORIGIN_URL)
              throw new ErrorObject('Invalid origin header!');

            res.upgrade(
              { id: randomUUID(), type: 'client', requestId: null },
              req.getHeader('sec-websocket-key'),
              req.getHeader('sec-websocket-protocol'),
              req.getHeader('sec-websocket-extensions'),
              context
            );
          } catch (err) {
            res.close();
            logger.error(err);
          }
        },
        open: (socket) => {
          this.#sockets.set(socket.id, socket);
          socket.send(JSON.stringify({ action: 'socket-info', id: socket.id }));
          logger.info(`A client has connected. ID: ${socket.id}`);
        },
        close: async (socket, code) => {
          try {
            await Request.clientAbort(socket.id);
            this.#sockets.delete(socket.id);
            logger.warn(`Connection with client ${socket.id} lost due to ${code}.`);
          } catch (err) {
            logger.error(err);
          }
        },
      })
      .ws(`${API_PATH}.uws/storage-servers`, {
        idleTimeout: WS_IDLE_TIMEOUT,
        upgrade: async (res, req, context) => {
          try {
            const token = req.getHeader('authorization').split(' ')[1];

            if (!token) throw new ErrorObject('No valid auth token!');
            const { id, name } = await jwtVerify(token);

            res.upgrade(
              { id, name, type: 'storage-server' },
              req.getHeader('sec-websocket-key'),
              req.getHeader('sec-websocket-protocol'),
              req.getHeader('sec-websocket-extensions'),
              context
            );
          } catch (err) {
            res.close();
            logger.error(err);
          }
        },
        open: async (socket) => {
          try {
            this.#sockets.set(socket.id, socket);
            logger.info(
              `Removed ${await Request.serverAbortUnfinished(
                socket.id
              )} unfinished transfers from ${socket.name} server.`
            );

            const { server } = await this.sendWithAck(socket.id, { action: 'fetch-server-info' });

            await StorageServer.add(server);

            socket.send(
              JSON.stringify({
                action: 'main-server-response',
                messageId: socket.id,
                response: { ok: true, status: 200 },
              })
            );

            logger.info(`Connection with ${server.name} server established!`);
          } catch (err) {
            socket.send(
              JSON.stringify({
                action: 'main-server-response',
                messageId: socket.id,
                response: { ok: false, status: 500, err },
              })
            );
            logger.error(err);
          }
        },
        message: async (_, message) => {
          const data = this.#decodeJSON(message);
          const { action } = data;

          if (action === 'server-response') {
            const { messageId, response } = data;
            this.#eventEmitter.emit(messageId, response);
          }
        },
        close: async (socket, code) => {
          try {
            this.#sockets.delete(socket.id);
            Request.serverTagUnfinished(socket.id);
            const server = await StorageServer.disconnect(socket.id);

            logger.warn(`Connection with ${server.name} server lost due to ${code}.`);
          } catch (err) {
            logger.error(err);
          }
        },
      });
  }

  static #decodeJSON(message) {
    try {
      return JSON.parse(this.#decoder.decode(message));
    } catch (err) {
      throw err;
    }
  }

  static send(id, message) {
    try {
      const socket = this.#sockets.get(id);
      if (!socket) throw new ErrorObject(`Socket ${id} was not found!`);

      const messageId = randomUUID();
      socket.send(JSON.stringify({ messageId, ...message }));

      return messageId;
    } catch (err) {
      throw err;
    }
  }

  static async sendWithAck(id, message) {
    try {
      return await new Promise((res) =>
        this.#eventEmitter.once(this.send(id, message), (response) => res(response))
      );
    } catch (err) {
      throw err;
    }
  }

  static async ack(messageId) {
    try {
      return await new Promise((res) =>
        this.#eventEmitter.once(messageId, (response) => res(response))
      );
    } catch (err) {
      throw err;
    }
  }

  static find(socketId) {
    return this.#sockets.get(socketId);
  }
}
