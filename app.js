import express from 'express';
import sequelize from './database/connection.js';
import './models/associations.js';
import Socket from './socket.js';
import appRoutes from './routes/appRoutes.js';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import storageServerStatus from './middlewares/storageServerStatus.js';
import errHandler from './middlewares/errHandler.js';
import { PORT, CORS_OPTIONS } from './config/config.js';
import serverInit from './serverInit.js';

try {
  const app = express();

  app.use(express.json());
  app.use(compression());
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors(CORS_OPTIONS));
  app.use(express.static('public'));
  app.use(storageServerStatus);
  app.use(appRoutes);
  app.use(errHandler);

  await sequelize.authenticate();
  console.log('Connection to database has been established successfully!');
  await sequelize.sync({ force: true });

  const server = app.listen(PORT ?? 3000, serverInit);

  Socket.init(server);

  process.on('uncaughtException', (err) => console.error(err));
} catch (err) {
  console.error(err);
}
