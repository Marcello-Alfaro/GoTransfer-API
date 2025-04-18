import '../models/associations.js';
import { parentPort } from 'worker_threads';
import Transfer from '../models/transfer.js';
import User from '../models/user.js';
import Folder from '../models/folder.js';
import File from '../models/file.js';
import UsersTransfers from '../models/userTransfer.js';
import { Op } from 'sequelize';
import { DAY_IN_MILISECONDS, FILE_WATCHER_INTERVAL } from '../config/config.js';
import TransferToExpired from '../emails/transferToExpire.js';
import TransferExpired from '../emails/transferExpired.js';
import Disk from '../models/disk.js';
import StorageServer from '../models/storageServer.js';
import logger from './logger.js';

(async function fileWatcher() {
  try {
    const transfersToExpire = await Transfer.findAll({
      where: { expire: { [Op.lt]: Date.now() + DAY_IN_MILISECONDS }, warned: false },
      include: [{ model: User, required: true }, File, Folder],
    });

    if (transfersToExpire.length > 0) {
      await Promise.all(
        transfersToExpire.map(async (entry) =>
          entry.setDataValue(
            'receivers',
            await Promise.all(
              (
                await UsersTransfers.findAll({ where: { transferId: entry.id } })
              ).map(async (entry) => await User.findByPk(entry.userId))
            )
          )
        )
      );

      transfersToExpire.forEach(async (transfer) => {
        transfer.receivers.forEach(async (user) => {
          await new TransferToExpired(user, transfer).send();
          await transfer.update({ warned: true });
        });
      });
    }

    const expiredFiles = await Transfer.findAll({
      where: { expire: { [Op.lt]: Date.now() }, warned: true },
      include: [
        { model: User, required: true },
        File,
        Folder,
        { model: Disk, include: { model: StorageServer, where: { online: true } }, required: true },
      ],
    });

    if (expiredFiles.length > 0) {
      await Promise.all(
        expiredFiles.map(async (entry) =>
          entry.setDataValue(
            'receivers',
            await Promise.all(
              (
                await UsersTransfers.findAll({ where: { transferId: entry.id } })
              ).map(async (entry) => await User.findByPk(entry.userId))
            )
          )
        )
      );

      expiredFiles.forEach(async (transfer) => {
        parentPort.postMessage({
          action: 'remove-transfer',
          transferId: transfer.transferId,
          serverId: transfer.Disk.StorageServer.serverId,
          diskPath: transfer.Disk.path,
        });
        await transfer.destroy();
        await Disk.reallocateSpace(transfer.Disk.id, transfer.size);

        transfer.receivers.forEach(async (user) => {
          if (transfer.User.id === user.id) return;
          await new TransferExpired(user.email, transfer).send();
        });

        await new TransferExpired(transfer.User.email, transfer).send();
      });
    }

    setTimeout(fileWatcher, FILE_WATCHER_INTERVAL);
  } catch (err) {
    logger.error(err);
  }
})();
