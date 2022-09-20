import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { PORT, SENDGRID_API_KEY } from './config/config.js';
import sequelize from './database/connection.js';
import sgMail from '@sendgrid/mail';
import checkFiles from './helpers/checkFiles.js';
import User from './models/user.js';
import NotAuthUser from './models/notAuthUser.js';
import Token from './models/token.js';
import File from './models/file.js';
import Dir from './models/dir.js';
import UserDir from './models/userDir.js';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/file.js';
import cors from './middlewares/cors.js';
import errHandler from './middlewares/errHandler.js';
import socket from './socket.js';

try {
  const app = express();
  sgMail.setApiKey(SENDGRID_API_KEY);

  User.hasMany(Token, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Token.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

  User.hasMany(Dir, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Dir.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

  NotAuthUser.hasMany(Dir, { foreignKey: 'notAuthUserId', onDelete: 'CASCADE' });
  Dir.belongsTo(NotAuthUser, { foreignKey: 'notAuthUserId', onDelete: 'CASCADE' });

  Dir.hasMany(File, { foreignKey: 'dirId', onDelete: 'CASCADE' });
  File.belongsTo(Dir, { foreignKey: 'dirId', onDelete: 'CASCADE' });

  Dir.belongsToMany(User, { through: UserDir, foreignKey: 'dirId', otherKey: 'userId' });
  User.belongsToMany(Dir, { through: UserDir, foreignKey: 'userId', otherKey: 'dirId' });

  app.use(express.json());

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

  const server = app.listen(PORT ?? 3000, () => {
    console.log(`Server's online on port ${PORT}`);
    checkFiles();
  });

  const io = socket.init(server);

  process.on('uncaughtException', (err) => {
    console.error(err);
  });
} catch (err) {
  console.error(err);
}
