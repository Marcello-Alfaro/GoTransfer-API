import express from 'express';
import sequelize from './database/connection.js';
import socket from './socket.js';
import sgMail from '@sendgrid/mail';
import User from './models/user.js';
import Attribute from './models/attribute.js';
import File from './models/file.js';
import Dir from './models/dir.js';
import Fileshake from './models/fileshake.js';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/file.js';
import cors from './middlewares/cors.js';
import helmet from 'helmet';
import compression from 'compression';
import errHandler from './middlewares/errHandler.js';
import { PORT, SENDGRID_API_KEY } from './config/config.js';
import serverInit from './helpers/serverInit.js';

try {
  const app = express();
  sgMail.setApiKey(SENDGRID_API_KEY);

  User.hasOne(Attribute, { foreignKey: 'id', onDelete: 'CASCADE' });
  Attribute.belongsTo(User, { foreignKey: 'id', onDelete: 'CASCADE' });

  User.hasMany(Dir, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Dir.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

  Dir.hasMany(File, { foreignKey: 'dirId', onDelete: 'CASCADE' });
  File.belongsTo(Dir, { foreignKey: 'dirId', onDelete: 'CASCADE' });

  User.belongsToMany(Dir, { through: Fileshake, foreignKey: 'userId', otherKey: 'dirId' });
  Dir.belongsToMany(User, { through: Fileshake, foreignKey: 'dirId', otherKey: 'userId' });

  app.use(express.json());
  app.use(express.raw({ type: 'application/octet-stream', limit: '15mb' }));
  app.use(compression());
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors);
  app.use(express.static('public'));
  app.use('/auth', authRoutes);
  app.use('/files', fileRoutes);
  app.use(errHandler);

  await sequelize.authenticate();
  console.log('Connection to database has been established successfully!');
  await sequelize.sync();

  const server = app.listen(PORT ?? 3000, serverInit);

  socket.init(server);

  process.on('uncaughtException', (err) => console.error(err));
} catch (err) {
  console.error(err);
}
