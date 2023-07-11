import io from './socket.js';
import sgMail from '@sendgrid/mail';
import User from './models/user.js';
import UsersTransfers from './models/userTransfer.js';
import Transfer from './models/transfer.js';
import File from './models/file.js';
import { Op } from 'sequelize';
import { PORT, FILE_WATCHER_INTERVAL } from './config/config.js';
import days from './helpers/days.js';
import email from './helpers/email.js';
import Folder from './models/folder.js';

export default () => {
  try {
    console.log(`Server started on port ${PORT ?? 3000}`);

    setInterval(async () => {
      try {
        if (!io.getServerSocket()) return;

        const filesAbout2Expire = await Transfer.findAll({
          where: { expire: { [Op.lt]: days(1) }, warned: false },
          include: [User, File, Folder],
        });

        if (filesAbout2Expire.length > 0) {
          await Promise.all(
            filesAbout2Expire.map(async (entry) => {
              entry.Files = [...entry.Files, ...entry.Folders];
              entry.setDataValue(
                'receivers',
                await Promise.all(
                  (
                    await UsersTransfers.findAll({ where: { transferId: entry.id } })
                  ).map(async (entry) => await User.findByPk(entry.userId))
                )
              );
            })
          );
        }
        const expiredFiles = await Transfer.findAll({
          where: { expire: { [Op.lt]: Date.now() }, warned: true },
          include: [User, File, Folder],
        });

        if (expiredFiles.length > 0) {
          await Promise.all(
            expiredFiles.map(async (entry) => {
              entry.Files = [...entry.Files, ...entry.Folders];
              entry.setDataValue(
                'receivers',
                await Promise.all(
                  (
                    await UsersTransfers.findAll({ where: { transferId: entry.id } })
                  ).map(async (entry) => await User.findByPk(entry.userId))
                )
              );
            })
          );
        }

        if (filesAbout2Expire.length > 0) {
          filesAbout2Expire.forEach(async (transfer) => {
            transfer.set({ warned: !transfer.warned });
            await transfer.save();
            const {
              User: { email: srcEmail },
              receivers,
            } = transfer.dataValues;

            receivers.forEach(async (user) => {
              const msgToReceiver = email.dstFilesAbout2Expire(srcEmail, user.email, transfer);
              await sgMail.send(msgToReceiver);
            });
          });
        }

        if (expiredFiles.length > 0) {
          expiredFiles.forEach(async (transfer) => {
            const {
              User: { email: srcEmail },
              receivers,
              transferId,
            } = transfer.dataValues;

            receivers.forEach(async (user) => {
              const msgToReceiver = email.dstFileExpired(srcEmail, user.email, transfer);
              await sgMail.send(msgToReceiver);
            });

            await transfer.destroy();
            io.getIO().of('/storage-server').emit('unlink-file', { transferId });
            const msgToSender = email.srcFileExpired(srcEmail, null, transfer);
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
