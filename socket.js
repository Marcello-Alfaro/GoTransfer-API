import { Server } from 'socket.io';
import { API_PATH, ORIGIN_URL } from './config/config.js';
import jwtVerify from './helpers/jwtVerify.js';
import ErrorObject from './helpers/errorObject.js';
import StorageServer from './models/storageServer.js';
import Request from './helpers/request.js';

export default class Socket {
  static #io;

  static init(server) {
    this.#io = new Server(server, {
      path: `${API_PATH}.io/`,
      cors: {
        origin: ORIGIN_URL,
        methods: ['GET', 'POST'],
      },
    });

    this.#io.of('/clients').on('connection', (socket) => {
      console.log('A client has connected!');

      socket.on('disconnect', (reason) => {
        Request.clientAbort(socket.id);
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
        socket.on('remove-unfinished', async (serverId, res) => {
          try {
            await Request.serverAbortUnfinished(serverId, socket.id);
            res();
          } catch (err) {
            throw err;
          }
        });

        socket.on('server-info', async (server) => {
          await StorageServer.add(server);

          console.log(`Connection with ${server.name} server established!`);
        });

        socket.on('disconnect', async (reason) => {
          const server = await StorageServer.disconnect(socket.id);
          Request.serverTagUnfinished(socket.id);

          console.log(`Connection with ${server.name} server lost due to ${reason}.`);
        });
      });
  }

  static getIO() {
    if (!this.#io) throw new ErrorObject('Socket.io not initialized!');
    return this.#io;
  }

  static getClientSocket(socketId) {
    if (!this.#io) throw new ErrorObject('Socket.io not initialized!');

    const clientSocket = this.#io.of('/clients').sockets.get(socketId);
    if (!clientSocket) throw new ErrorObject(`Invalid socket id: ${socketId}`);

    return clientSocket;
  }

  static getServerSocket(socketId) {
    if (!this.#io) throw new ErrorObject('Socket.io not initialized!');

    const serverSocket = this.#io.of('/storage-servers').sockets.get(socketId);
    if (!serverSocket) throw new ErrorObject(`Invalid socket id: ${socketId}`);

    return serverSocket;
  }
}
