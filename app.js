import express from 'express';
import { PORT } from './config/config.js';
import socket from './socket.js';

try {
  socket.init(
    (() => {
      const app = express();
      const server = app.listen(PORT ?? 3000);
      return { app, server };
    })()
  );

  process.on('uncaughtException', (err) => console.error(err));
} catch (err) {
  console.error(err);
}
