import socket from '../socket.js';
import sgMail from '@sendgrid/mail';
import User from '../models/user.js';
import File from '../models/file.js';
import Dir from '../models/dir.js';
import { Op } from 'sequelize';
import { PORT } from '../config/config.js';
import days from './days.js';
import email from './email.js';

export default () => {
  try {
    console.log(`Server started on port ${PORT ?? 3000}`);

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
