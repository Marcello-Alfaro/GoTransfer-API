import express from 'express';
import sequelize from '../database/connection.js';
import socket from '../socket.js';
import sgMail from '@sendgrid/mail';
import User from '../models/user.js';
import Attribute from '../models/attribute.js';
import Token from '../models/token.js';
import File from '../models/file.js';
import Dir from '../models/dir.js';
import Fileshake from '../models/fileshake.js';
import authRoutes from '../routes/auth.js';
import fileRoutes from '../routes/file.js';
import cors from '../middlewares/cors.js';
import helmet from 'helmet';
import compression from 'compression';
import errHandler from '../middlewares/errHandler.js';
import { Op } from 'sequelize';
import { PORT, SENDGRID_API_KEY } from '../config/config.js';
import days from './days.js';
import email from './email.js';

export default async (server) => {
  try {
    console.log(`Server started on port ${PORT ?? 3000}`);

    sgMail.setApiKey(SENDGRID_API_KEY);

    User.hasOne(Attribute, { foreignKey: 'id', onDelete: 'CASCADE' });
    Attribute.belongsTo(User, { foreignKey: 'id', onDelete: 'CASCADE' });

    Dir.hasMany(File, { foreignKey: 'dirId', onDelete: 'CASCADE' });
    File.belongsTo(Dir, { foreignKey: 'dirId', onDelete: 'CASCADE' });

    User.belongsToMany(Dir, { through: Fileshake, foreignKey: 'userId', otherKey: 'dirId' });
    Dir.belongsToMany(User, { through: Fileshake, foreignKey: 'dirId', otherKey: 'userId' });

    server.use(express.json());

    server.use(compression());
    server.use(helmet({ crossOriginResourcePolicy: false }));
    server.use(cors);
    server.use(express.static('public'));
    server.use('/auth', authRoutes);
    server.use('/files', fileRoutes);
    server.use(errHandler);

    await sequelize.authenticate();
    console.log('Connection to database has been established successfully!');
    await sequelize.sync();

    setInterval(async () => {
      try {
        const filesAbout2Expire = await User.findAll({
          include: {
            model: Dir,
            where: { expire: { [Op.lt]: days(1) }, warned: false },
            include: File,
          },
        });

        const expiredFiles = await User.findAll({
          include: {
            model: Dir,
            where: { expire: { [Op.lt]: Date.now() }, warned: true },
            include: {
              model: File,
              paranoid: false,
            },
          },
        });

        if (filesAbout2Expire.length > 0) {
          filesAbout2Expire.forEach(async (entry) => {
            const { srcEmail, dstEmail } = entry;

            entry.Dirs.forEach(async (entry) => {
              entry.set({ warned: !entry.warned });
              await entry.save();

              const msgToDest = email.dstFilesAbout2Expire(srcEmail, dstEmail, entry);
              await sgMail.send(msgToDest);
            });
          });
        }

        if (expiredFiles.length > 0) {
          expiredFiles.forEach(async (entry) => {
            const { srcEmail, dstEmail } = entry;
            entry.Dirs.forEach(async (entry) => {
              const { dirId } = entry;
              await entry.destroy();
              socket.getIO().of('/storage-server').emit('unlink-file', { dirId });
              const msgToSource = email.srcFileExpired(srcEmail, dstEmail, entry);
              await sgMail.send(msgToSource);
            });
          });
        }
      } catch (err) {
        throw err;
      }
    }, 1000);

    process.on('uncaughtException', (err) => console.error(err));
  } catch (err) {
    console.error(err);
  }
};
