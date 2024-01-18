import { API_PATH, PORT, CORS_OPTIONS } from './config/config.js';
import express from 'express';
import sequelize from './database/connection.js';
import './models/associations.js';
import Socket from './socket.js';
import appRoutes from './routes/appRoutes.js';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import storageServerStatus from './middlewares/storageServerStatus.js';
import errorHandler from './middlewares/errorHandler.js';
import serverInit from './serverInit.js';

try {
  const app = express();

  app.use(express.json());
  app.use(compression());
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors(CORS_OPTIONS));
  app.use(API_PATH, express.static('public'));
  app.use(storageServerStatus);
  app.use(API_PATH, appRoutes);
  app.use(errorHandler);

  await sequelize.authenticate();
  console.log('Connection to database has been established successfully!');
  await sequelize.sync();

  const server = app.listen(PORT ?? 3000, serverInit);

  Socket.init(server);

  process.on('uncaughtException', (err) => console.error(err));
} catch (err) {
  console.error(err);
}
