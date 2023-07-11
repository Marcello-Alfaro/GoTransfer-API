import express from 'express';
import sequelize from './database/connection.js';
import socket from './socket.js';
import sgMail from '@sendgrid/mail';
import User from './models/user.js';
import Attribute from './models/attribute.js';
import File from './models/file.js';
import Folder from './models/folder.js';
import Transfer from './models/transfer.js';
import UsersTransfers from './models/userTransfer.js';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/file.js';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import storageServerStatus from './middlewares/storageServerStatus.js';
import errHandler from './middlewares/errHandler.js';
import { PORT, CORS_OPTIONS, SENDGRID_API_KEY } from './config/config.js';
import serverInit from './serverInit.js';

try {
  const app = express();
  sgMail.setApiKey(SENDGRID_API_KEY);

  User.hasOne(Attribute, { foreignKey: 'id', onDelete: 'CASCADE' });
  Attribute.belongsTo(User, { foreignKey: 'id', onDelete: 'CASCADE' });

  User.hasMany(Transfer, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Transfer.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

  Transfer.hasMany(File, { foreignKey: 'transferId', onDelete: 'CASCADE' });
  File.belongsTo(Transfer, { foreignKey: 'transferId', onDelete: 'CASCADE' });

  Transfer.hasMany(Folder, { foreignKey: 'transferId', onDelete: 'CASCADE' });
  Folder.belongsTo(Transfer, { foreignKey: 'transferId', onDelete: 'CASCADE' });

  Folder.hasMany(File, { foreignKey: 'folderId', onDelete: 'CASCADE' });
  File.belongsTo(Folder, { foreignKey: 'folderId', onDelete: 'CASCADE' });

  User.belongsToMany(Transfer, {
    through: UsersTransfers,
    foreignKey: 'userId',
    otherKey: 'transferId',
  });
  Transfer.belongsToMany(User, {
    through: UsersTransfers,
    foreignKey: 'transferId',
    otherKey: 'userId',
  });

  app.use(express.json());
  app.use(compression());
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors(CORS_OPTIONS));
  app.use(express.static('public'));
  app.use(storageServerStatus);
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
