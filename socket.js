import EventEmitter from 'events';
import { randomUUID } from 'crypto';
import { API_PATH } from './config/config.js';
import jwtVerify from './helpers/jwtVerify.js';
import ErrorObject from './helpers/errorObject.js';
import StorageServer from './models/storageServer.js';
import Request from './helpers/request.js';
import logger from './helpers/logger.js';
import { WebSocketServer } from 'ws';

export default class Socket {
  static #eventEmitter = new EventEmitter();
  static #decoder = new TextDecoder('utf-8');
  static #webSocketServer = new WebSocketServer({ noServer: true });

  static init(server) {
    server.on('upgrade', async (req, socket, head) => {
      try {
        if (req.url === `${API_PATH}.ws/storage-servers`) {
          const token = req.headers['authorization']?.split(' ')[1];
          if (!token) throw new ErrorObject('No valid auth token!');

          const { id, name } = await jwtVerify(token);

          this.#webSocketServer.handleUpgrade(req, socket, head, async (ws) => {
            try {
              ws.id = id;

              ws.sendWithAck = async function (eventEmitter, message) {
                const messageId = randomUUID();

                this.send(JSON.stringify({ messageId, ...message }));

                return new Promise((res) =>
                  eventEmitter.once(messageId, (response) => res(response))
                );
              };

              ws.keepAlive = function () {
                if (this.readyState !== WebSocket.OPEN) return;

                this.isAlive = false;
                this.ping();
                setTimeout(() => (!this.isAlive ? this.terminate() : this.keepAlive()), 15000);
              };

              ws.keepAlive();

              ws.on('pong', () => (ws.isAlive = true));

              ws.on('message', async (message) => {
                const data = this.#decodeJSON(message);
                const { action } = data;

                if (action === 'server-response') {
                  const { messageId, response } = data;
                  this.#eventEmitter.emit(messageId, response);
                }
              });

              ws.on('close', async (code) => {
                try {
                  await StorageServer.disconnect(id);

                  logger.warn(`Connection with ${name} server lost due to ${code}.`);
                } catch (err) {
                  logger.error(err);
                }
              });

              ws.on('error', (err) => {
                logger.error(`Connection with ${name} server encounter an error ${err}.`);
                ws.terminate();
              });

              const server = await ws.sendWithAck(this.#eventEmitter, {
                action: 'fetch-server-info',
              });

              await StorageServer.add(server);

              ws.send(
                JSON.stringify({
                  action: 'main-server-response',
                  messageId: id,
                  response: { ok: true, status: 200 },
                })
              );

              logger.info(`Connection with ${name} server established!`);
            } catch (err) {
              logger.error(err);
              ws.send(
                JSON.stringify({
                  action: 'main-server-response',
                  messageId: id,
                  response: { ok: false, status: 500, err },
                })
              );
            }
          });
        } else if (req.url.startsWith(`${API_PATH}.ws/clients`)) {
          const transferId = req.url.split('/').at(-1);

          const transfer = Request.find(transferId);
          if (!transfer) throw new ErrorObject('Unauthorized!');

          this.#webSocketServer.handleUpgrade(req, socket, head, async (ws) => {
            ws.id = transferId;

            ws.keepAlive = function () {
              if (this.readyState !== WebSocket.OPEN) return;

              this.isAlive = false;
              this.ping();
              setTimeout(() => (!this.isAlive ? this.terminate() : this.keepAlive()), 15000);
            };

            ws.keepAlive();

            ws.on('pong', () => (ws.isAlive = true));

            logger.info(`WebSocket connection for transfer ${transferId} was established.`);

            ws.on('close', async (code) => {
              if (code !== 1000) {
                await Request.clientAbort(transferId);
                return logger.warn(
                  `WebSocket connection with transfer ${transferId} was lost due to ${code}.`
                );
              }

              logger.info(
                `WebSocket connection with transfer ${transferId} was closed gracefully.`
              );
            });

            ws.on('error', (err) => {
              logger.error(
                `WebSocket connection with transfer ${transferId} encounter an error ${err}.`
              );
              ws.terminate();
            });
          });
        } else {
          socket.destroy();
        }
      } catch (err) {
        logger.error(err);
        socket.destroy();
      }
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
      const socket = this.find(id);

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

  static find(id) {
    for (const socket of this.#webSocketServer.clients) if (socket.id === id) return socket;
    throw new ErrorObject(`Socket ${id} was not found!`);
  }
}
