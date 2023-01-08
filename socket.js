import { Server } from 'socket.io';
import { CORS_ORIGIN } from './config/config.js';
import jwtVerify from './helpers/jwtVerify.js';
import throwErr from './helpers/throwErr.js';
let io;
let socket;
let storageServerSocket;

export default {
  init(server) {
    io = new Server(server, {
      cors: {
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (sck) => {
      console.log('A client has connected!');
      socket = sck;
    });

    io.of('/storage-server')
      .use(async (socket, next) => {
        try {
          const {
            auth: { token },
          } = socket.handshake;
          if (!token) throwErr('No valid auth token!', 401);
          await jwtVerify(token);
          next();
        } catch (err) {
          next(err);
        }
      })
      .on('connection', (socket) => {
        console.log('Connection with storage server established!');
        storageServerSocket = socket;
      });

    return io;
  },

  getIO() {
    if (!io) throwErr('Socket.io not initialized!');
    return io;
  },

  getSocket() {
    if (!io) throwErr('Socket.io not initialized!');
    return socket;
  },

  getServerSocket() {
    if (!io) throwErr('Socket.io not initialized!');
    return storageServerSocket;
  },
};

process.on('uncaughtException', (err) => console.error(err));
