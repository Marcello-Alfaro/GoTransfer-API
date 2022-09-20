import { Server } from 'socket.io';
import { CORS_ORIGIN } from './config/config.js';
import throwErr from './helpers/throwErr.js';
let io;
let socket;

export default {
  init(httpServer) {
    io = new Server(httpServer, {
      cors: {
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST'],
      },
    });
    io.on('connection', (sck) => {
      console.log(`A client has connected! socket ID: ${sck.id}`);
      socket = sck;
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
};
