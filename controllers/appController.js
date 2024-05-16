import { DAY_IN_MILISECONDS, MAX_FILE_SIZE, TRANSFER_EXPIRE_TIME } from '../config/config.js';
import ErrorObject from '../helpers/errorObject.js';
import Transfer from '../models/transfer.js';
import File from '../models/file.js';
import Folder from '../models/folder.js';
import validator from 'validator';
import User from '../models/user.js';
import StorageServer from '../models/storageServer.js';
import Download from '../models/download.js';
import Socket from '../socket.js';
import { pipeline } from 'stream/promises';
import busboy from 'busboy';
import TransferSentSrc from '../emails/transferSentSrc.js';
import TransferSentDst from '../emails/transferSentDst.js';
import Disk from '../models/disk.js';
import Request from '../helpers/request.js';

export default {
  async getTransferResult(req, res, next) {
    try {
      const transfer = Request.remove(req.params.transferId);

      const { dskId: diskId, sender, receivers, files, folders } = transfer;

      const [user] = await User.findOrCreate({
        where: { email: sender },
        defaults: { email: sender },
        attributes: ['id'],
      });

      const transferReceivers = await Promise.all(
        receivers.map(async (receiver) =>
          (
            await User.findOrCreate({
              where: { email: receiver },
              defaults: { email: receiver },
            })
          ).at(0)
        )
      );

      await transfer
        .set({
          expire: Date.now() + TRANSFER_EXPIRE_TIME * DAY_IN_MILISECONDS,
          userId: user.id,
          diskId,
        })
        .save({ files, folders, transferReceivers });

      if (transferReceivers.length > 1) {
        await new TransferSentSrc(sender, transfer).send();

        await Promise.all(
          transferReceivers.map(
            async (receiver) => await new TransferSentDst(receiver, transfer).send()
          )
        );

        return res.status(201).json({ message: `Your files were sent successfully! 🍧` });
      }

      await new TransferSentSrc(sender, transfer).send();
      await new TransferSentDst(transferReceivers[0], transfer).send();

      res.status(201).json({ message: `Your files were sent successfully! 🍧` });
    } catch (err) {
      next(err);
    }
  },

  async getDownloadTransfer(req, res, next) {
    try {
      const { tid: transferId, dtyp: type, ffid, dstid } = req.token;

      const transfer = await (async () => {
        try {
          if (type === 'b5ac9c2b')
            return await Transfer.findOne({
              where: { transferId },
              include: [
                { model: User, required: true },
                { model: File, where: { fileId: ffid } },
                {
                  model: Disk,
                  include: { model: StorageServer, where: { online: true } },
                  required: true,
                },
              ],
            });

          if (type === '08ad027d')
            return await Transfer.findOne({
              where: { transferId },
              include: [
                { model: User, required: true },
                {
                  model: Folder,
                  where: { folderId: ffid },
                  include: { model: File, required: true },
                },
                {
                  model: Disk,
                  include: { model: StorageServer, where: { online: true } },
                  required: true,
                },
              ],
            });

          return await Transfer.findOne({
            where: { transferId },
            include: [
              { model: User, required: true },
              { model: File },
              { model: Folder, include: { model: File, required: true } },
              {
                model: Disk,
                include: { model: StorageServer, where: { online: true } },
                required: true,
              },
            ],
          });
        } catch (err) {
          next(err);
        }
      })();

      if (!transfer)
        throw new ErrorObject('Transfer expired, invalid or service unavailable!', 503);

      const user = await User.findOne({ where: { userId: dstid } });

      if (!user) throw new ErrorObject(`User with id of ${dstid} not found!`);

      const { downloadId } = Request.add(
        Download.build({
          requestId: null,
          mainHttpResponse: res,
          userId: user.id,
          transferId: transfer.id,
          dstUser: user,
          transfer,
        })
      );

      Socket.send(transfer.Disk.StorageServer.serverId, {
        action: 'fetch-transfer',
        type,
        downloadId,
        transfer,
      });

      return res.attachment(
        !type
          ? `${transfer.title}.zip`
          : type === 'b5ac9c2b'
          ? transfer.Files[0].name
          : `${transfer.Folders[0].name}.zip`
      );
    } catch (err) {
      next(err);
    }
  },

  async putRedirectMain(req, res, next) {
    try {
      const download = Request.remove(req.headers.downloadid);

      await pipeline(req, download.mainHttpResponse);
      res.sendStatus(200);
      await download.set({ downloadedAt: new Date() }).save();
    } catch (err) {
      next(err);
    }
  },

  async getAllocateTransfer(req, res, next) {
    try {
      const { socketId } = req;
      const { sender, receivers, title, message, size, files, folders } = req.body;

      if (validator.isEmpty(sender) || !validator.isEmail(sender))
        throw new ErrorObject('Your email is required and must be a valid email.', 422);
      if (!receivers?.length > 0) throw new ErrorObject('There are no receivers to send.', 422);
      receivers.forEach((entry) => {
        if (validator.isEmpty(entry) || !validator.isEmail(entry))
          throw new ErrorObject('Receiver email is required and must be a valid email.', 422);
      });
      if (size > MAX_FILE_SIZE) throw new ErrorObject('File is too big! Max file size is 4GB', 422);

      const { transferId } = Request.add(
        await Transfer.allocate(sender, receivers, title, message, size, files, folders, socketId)
      );

      res.status(200).json(transferId);
    } catch (err) {
      next(err);
    }
  },

  async putUploadHandler(req, res, next) {
    try {
      const transfer = Request.find(req.params.transferId);

      const { transferId, clientSocket, server } = transfer;

      const { headers } = req;

      const bb = busboy({ headers });

      bb.on('file', (fileId, file) => {
        try {
          transfer.nextFile = File.build({
            fileId,
            file,
            clientSocket,
          });

          req.messageId = Socket.send(server.serverId, {
            action: 'handle-file',
            fileId,
            transferId,
            diskPath: server.Disks[0].path,
          });
        } catch (err) {
          next(err);
        }
      });

      await pipeline(req, bb);

      await Socket.ack(req.messageId);

      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  },

  getRedirectStorage(req, res, next) {
    try {
      const { nextFile } = Request.find(req.headers.transferid);

      nextFile.triggerStream(res);
    } catch (err) {
      next(err);
    }
  },
};
