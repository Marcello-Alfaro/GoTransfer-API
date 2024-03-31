import { API_PATH, PORT, CORS_OPTIONS } from './config/config.js';
import express from 'express';
import Socket from './socket.js';
import appRoutes from './routes/appRoutes.js';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import errorHandler from './middlewares/errorHandler.js';
import serverInit from './serverInit.js';

try {
  const app = express();

  app.use(express.json({ limit: '250kb' }));
  app.use(compression());
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors(CORS_OPTIONS));
  app.use(API_PATH, appRoutes);
  app.use(errorHandler);

  const server = app.listen(PORT, await serverInit);

  Socket.init(server);

  process.on('uncaughtException', (err) => console.error(err));
} catch (err) {
  console.error(err);
}
