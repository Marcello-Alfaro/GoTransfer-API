import uWS from 'uWebSockets.js';
import EventEmitter from 'events';
import { randomUUID } from 'crypto';
import { API_PATH, WS_PORT } from './config/config.js';
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
    uWS
      .App()
      .listen(+WS_PORT, (token) =>
        token
          ? logger.info(`uWebSockets Server started on port ${WS_PORT}`)
          : logger.error('Failed to start server')
      )
      .ws(`${API_PATH}.uws`, {
        open: (socket) => {
          socket.id = randomUUID();
          socket.type = 'client';
        },
        message: async (socket, message) => {
          const data = this.#decodeJSON(message);
          const { action } = data;

          if (action === 'add-client') {
            this.#sockets.set(socket.id, socket);
            socket.send(JSON.stringify({ action: 'socket-info', id: socket.id }));

            logger.info(`Client ${socket.id} has connected.`);
          }
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

            socket.send(
              JSON.stringify({
                action: 'main-server-response',
                messageId: socket.id,
                response: { ok: true, status: 200 },
              })
            );
          } catch (err) {
            logger.error(err);
          }
        },

        message: async (socket, message) => {
          const data = this.#decodeJSON(message);
          const { action } = data;

          if (action === 'fetch-server-info') {
            try {
              await StorageServer.add(data.server);

              socket.send(
                JSON.stringify({
                  action: 'main-server-response',
                  messageId: data.messageId,
                  response: { ok: true, status: 200 },
                })
              );

              logger.info(`Connection with ${data.server.name} server established!`);
            } catch (err) {
              logger.error(err);
            }
          }

          if (action === 'server-response') {
            const { messageId, response } = data;
            this.#eventEmitter.emit(messageId, response);
          }
        },

        close: async (socket, code) => {
          try {
            const server = await StorageServer.disconnect(socket.id);
            Request.serverTagUnfinished(socket.id);
            this.#sockets.delete(socket.id);

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
      if (!socket) throw new ErrorObject('Server socket not found!');

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
}

/* export default class Socket {
  static #io;

  static init() {
    this.#io = new Server(server, {
      path: `${API_PATH}.io/`,
      cors: {
        origin: ORIGIN_URL,
        methods: ['GET', 'POST'],
      },
    });

    this.#io.of('/clients').on('connection', (socket) => {
      logger.info('A client has connected!');

      socket.on('disconnect', async (reason) => {
        try {
          await Request.clientAbort(socket.id);
          logger.warn(`Connection with client ${socket.id} lost due to ${reason}.`);
        } catch (err) {
          logger.error(err);
        }
      });
    });

    this.#io
      .of('/storage-servers')
      .use(async (socket, next) => {
        try {
          const {
            auth: { token },
          } = socket.handshake;
          if (!token) throw new ErrorObject('No valid auth token!', 401);
          await jwtVerify(token);
          next();
        } catch (err) {
          next(err);
        }
      })
      .on('connection', (socket) => {
        socket.on('remove-unfinished', async (serverId, res) => {
          try {
            await Request.serverAbortUnfinished(serverId, socket.id);
            res();
          } catch (err) {
            logger.error(err);
          }
        });

        socket.on('server-info', async (server) => {
          try {
            await StorageServer.add(server);

            logger.info(`Connection with ${server.name} server established!`);
          } catch (err) {
            logger.error(err);
          }
        });

        socket.on('disconnect', async (reason) => {
          try {
            const server = await StorageServer.disconnect(socket.id);
            Request.serverTagUnfinished(socket.id);

            logger.warn(`Connection with ${server.name} server lost due to ${reason}.`);
          } catch (err) {
            logger.error(err);
          }
        });
      });
  }

  static getClientSocket(socketId) {
    try {
      if (!this.#io) throw new ErrorObject('Socket.io not initialized!');

      const clientSocket = this.#io.of('/clients').sockets.get(socketId);
      if (!clientSocket) throw new ErrorObject(`Invalid socket id: ${socketId}`);

      return clientSocket;
    } catch (err) {
      throw err;
    }
  }

  static getServerSocket(socketId) {
    try {
      if (!this.#io) throw new ErrorObject('Socket.io not initialized!');

      const serverSocket = this.#io.of('/storage-servers').sockets.get(socketId);
      if (!serverSocket) throw new ErrorObject(`Invalid socket id: ${socketId}`);

      return serverSocket;
    } catch (err) {
      throw err;
    }
  }
}
 */
