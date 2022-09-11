import { Server } from 'socket.io';
import { CORS_ORIGIN } from './config/config.js';
import throwErr from './helpers/throwErr.js';
let io;

export default {
  init(httpServer) {
    io = new Server(httpServer, {
      cors: {
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST'],
      },
    });
    return io;
  },
  getIO() {
    if (!io) throwErr('Socket.io not initialized!');
    return io;
  },
};
