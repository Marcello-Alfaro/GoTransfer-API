import { Server } from 'socket.io';
import { CORS_ORIGIN } from './config/config.js';
import jwtVerify from './helpers/jwtVerify.js';
import ErrorObject from './helpers/error.js';
import StorageServer from './models/storageServer.js';
import Transfer from './models/transfer.js';

export default class Socket {
  static #io;

  static init(server) {
    this.#io = new Server(server, {
      cors: {
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST'],
      },
    });

    this.#io.of('/clients').on('connection', (socket) => {
      console.log('A client has connected!');

      socket.on('disconnect', (reason) => {
        Transfer.findBySocket(socket.id)?.abort();
        console.log(`Connection with client ${socket.id} lost due to ${reason}.`);
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
        socket.on('server-info', async (server) => {
          await StorageServer.add({ ...server, socketId: socket.id });

          console.log(`Connection with ${server.name} server established!`);
        });

        socket.on('disconnect', async (reason) => {
          const server = await StorageServer.disconnect(socket.id);

          console.log(`Connection with ${server.name} server lost due to ${reason}.`);
        });
      });
  }

  static getIO() {
    if (!this.#io) throw new ErrorObject('Socket.io not initialized!');
    return this.#io;
  }

  static toClient(socketId) {
    if (!this.#io) throw new ErrorObject('Socket.io not initialized!');
    return this.#io.of('/clients').to(socketId);
  }

  static toServer(socketId) {
    if (!this.#io) throw new ErrorObject('Socket.io not initialized!');
    return this.#io.of('/storage-servers').to(socketId);
  }

  static getServerSocket(socketId) {
    if (!this.#io) throw new ErrorObject('Socket.io not initialized!');
    return this.#io.of('/storage-servers').sockets.get(socketId);
  }
}
