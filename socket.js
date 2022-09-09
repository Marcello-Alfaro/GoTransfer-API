import { Server } from 'socket.io';
import throwErr from './helpers/throwErr.js';
let io;

export default {
  init(httpServer) {
    io = new Server(httpServer, {
      cors: {
        origin: '*',
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
