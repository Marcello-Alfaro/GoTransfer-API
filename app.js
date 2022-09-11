import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { PORT } from './config/config.js';
import sequelize from './database/connection.js';
import User from './models/User.js';
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

  User.hasMany(Token, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Token.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

  User.hasMany(Dir, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Dir.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

  Dir.hasMany(File, { foreignKey: 'dirId', onDelete: 'CASCADE' });
  File.belongsTo(Dir, { foreignKey: 'dirId', onDelete: 'CASCADE' });

  Dir.belongsToMany(User, { through: UserDir, foreignKey: 'dirId', otherKey: 'userId' });
  User.belongsToMany(Dir, { through: UserDir, foreignKey: 'userId', otherKey: 'dirId' });

  app.use(express.json());

  app.use(compression());
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors);
  app.use('/auth', authRoutes);
  app.use('/files', fileRoutes);
  app.use(errHandler);

  await sequelize.authenticate();
  console.log('Connection to database has been established successfully!');
  await sequelize.sync();
  if (!(await User.findByPk(1)))
    await User.create({
      name: 'test',
      lastname: 'testing',
      username: 'test4testing',
      email: 'test@test.com',
      password: '$2a$12$K12qqTacOGtgncDhbsyYtuMpAykDbQoT2fTDbAWqAXRxnkT0CU8YG',
    });
  if (!(await User.findByPk(2)))
    await User.create({
      name: 'test2',
      lastname: 'testing2',
      username: 'test2you',
      email: 'test2@test.com',
      password: '$2a$12$K12qqTacOGtgncDhbsyYtuMpAykDbQoT2fTDbAWqAXRxnkT0CU8YG',
    });
  const server = app.listen(PORT ?? 3000, () => console.log(`Server started on port ${PORT}`));
  const io = socket.init(server);
  io.on('connection', (socket) => {
    console.log('A client has connected!');
  });
  process.on('uncaughtException', (err) => {
    console.error(err);
  });
} catch (err) {
  console.error(err);
}
