import { API_PATH, PORT, CORS_OPTIONS } from './config/config.js';
import logger from './helpers/logger.js';
import express from 'express';
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
  server.requestTimeout = 0;
  server.setTimeout(120000, (socket) => socket.destroy());

  process.on('uncaughtException', (err) => {
    logger.fatal(err);
    server.close(() => process.exit(1));

    setTimeout(() => process.abort(), 1000).unref();
    process.exit(1);
  });
} catch (err) {
  logger.error(err);
}
