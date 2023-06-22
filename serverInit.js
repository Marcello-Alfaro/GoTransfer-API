import io from './socket.js';
import sgMail from '@sendgrid/mail';
import User from './models/user.js';
import Fileshake from './models/fileshake.js';
import Dir from './models/dir.js';
import File from './models/file.js';
import { Op } from 'sequelize';
import { PORT, FILE_WATCHER_INTERVAL } from './config/config.js';
import days from './helpers/days.js';
import email from './helpers/email.js';

export default () => {
  try {
    console.log(`Server started on port ${PORT ?? 3000}`);

    setInterval(async () => {
      try {
        if (!io.getServerSocket()) return;

        const filesAbout2Expire = await Dir.findAll({
          where: { expire: { [Op.lt]: days(1) }, warned: false },
          include: [User, File],
        });

        if (filesAbout2Expire.length > 0) {
          await Promise.all(
            filesAbout2Expire.map(async (entry) => {
              entry.setDataValue(
                'receivers',
                await Promise.all(
                  (
                    await Fileshake.findAll({ where: { dirId: entry.id } })
                  ).map(async (entry) => await User.findByPk(entry.userId))
                )
              );
            })
          );
        }
        const expiredFiles = await Dir.findAll({
          where: { expire: { [Op.lt]: Date.now() }, warned: true },
          include: [User, File],
        });

        if (expiredFiles.length > 0) {
          await Promise.all(
            expiredFiles.map(async (entry) => {
              entry.setDataValue(
                'receivers',
                await Promise.all(
                  (
                    await Fileshake.findAll({ where: { dirId: entry.id } })
                  ).map(async (entry) => await User.findByPk(entry.userId))
                )
              );
            })
          );
        }

        if (filesAbout2Expire.length > 0) {
          filesAbout2Expire.forEach(async (dir) => {
            dir.set({ warned: !dir.warned });
            await dir.save();
            const {
              User: { email: srcEmail },
              receivers,
            } = dir.dataValues;

            receivers.forEach(async (user) => {
              const msgToReceiver = email.dstFilesAbout2Expire(srcEmail, user.email, dir);
              await sgMail.send(msgToReceiver);
            });
          });
        }

        if (expiredFiles.length > 0) {
          expiredFiles.forEach(async (dir) => {
            const {
              User: { email: srcEmail },
              receivers,
              dirId,
            } = dir.dataValues;

            receivers.forEach(async (user) => {
              const msgToReceiver = email.dstFileExpired(srcEmail, user.email, dir);
              await sgMail.send(msgToReceiver);
              console.log('sent email to', user.email);
            });

            await dir.destroy();
            io.getIO().of('/storage-server').emit('unlink-file', { dirId });
            const msgToSender = email.srcFileExpired(srcEmail, null, dir);
            await sgMail.send(msgToSender);
          });
        }
      } catch (err) {
        throw err;
      }
    }, FILE_WATCHER_INTERVAL);

    process.on('uncaughtException', (err) => console.error(err));
  } catch (err) {
    console.error(err);
  }
};
