import { MAX_FILE_SIZE, TRANSFER_EXPIRE_TIME } from '../config/config.js';
import ErrorObject from '../helpers/error.js';
import days from '../helpers/days.js';
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

export default {
  async getTransferResult(req, res, next) {
    try {
      const transfer = Transfer.remove(req.params.uploadId).formatFiles();

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
        .set({ expire: days(TRANSFER_EXPIRE_TIME), userId: user.id, diskId })
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
      const { tid: transferId, dtyp: type, ffid, dste } = req.token;

      const transfer = await (async () => {
        try {
          if (type === 'b5ac9c2b')
            return await Transfer.findOne({
              where: { transferId },
              include: [
                { model: User, where: { userId: dste } },
                { model: File, where: { fileId: ffid } },
                { model: Disk, include: StorageServer },
              ],
            });

          if (type === '08ad027d')
            return await Transfer.findOne({
              where: { transferId },
              include: [
                { model: User, where: { userId: dste } },
                { model: Folder, where: { folderId: ffid }, include: File },
                { model: Disk, include: StorageServer },
              ],
            });

          return await Transfer.findOne({
            where: { transferId },
            include: [
              { model: User, where: { userId: dste } },
              File,
              { model: Folder, include: File },
              { model: Disk, include: StorageServer },
            ],
          });
        } catch (err) {
          next(err);
        }
      })();

      if (!transfer) throw new ErrorObject('Transfer expired or invalid!', 404);

      const { downloadId } = Download.build({
        mainHttpResponse: res,
        userId: transfer.User.id,
        transferId: transfer.id,
        transfer,
      }).add();

      const { socketId } = StorageServer.find(transfer.Disk.StorageServer.id);

      Socket.getServerSocket(socketId).emit('fetch-transfer', {
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
      const download = Download.remove(req.headers.downloadid);

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
      const { sender, receivers, title, message, size } = req.body;

      if (validator.isEmpty(sender) || !validator.isEmail(sender))
        throw new ErrorObject('Your email is required and must be a valid email.', 422);
      if (!receivers?.length > 0) throw new ErrorObject('There are no receivers to send.', 422);
      receivers.forEach((entry) => {
        if (validator.isEmpty(entry) || !validator.isEmail(entry))
          throw new ErrorObject('Receiver email is required and must be a valid email.', 422);
      });
      if (size > MAX_FILE_SIZE) throw new ErrorObject('File is too big! Max file size is 4GB', 422);

      const transferId = await Transfer.allocate(sender, receivers, title, message, size, socketId);

      res.status(200).json(transferId);
    } catch (err) {
      next(err);
    }
  },

  async putUploadHandler(req, res, next) {
    try {
      const transfer = Transfer.find(req.params.uploadId);

      const { transferId, clientSocket, serverSocket, diskPath } = transfer;
      const { headers } = req;

      const bb = busboy({ headers });

      bb.on('file', (path, file, info) => {
        const { filename: name, mimeType: type, size = +headers['content-length'] } = info;

        const fileId = transfer.pushFile(
          File.build({
            name,
            size,
            type,
            path,
            file,
            clientSocket,
          })
        );
        req.fileId = fileId;
        Socket.toServer(serverSocket).emit('handle-file', {
          fileId,
          transferId,
          diskPath,
        });
      });

      await pipeline(req, bb);

      await new Promise((res) =>
        Socket.getServerSocket(serverSocket).once(req.fileId, (ack) => res(ack))
      );

      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  },

  getRedirectStorage(req, res, next) {
    try {
      const { transferid, fileid } = req.headers;
      const file = Transfer.findFile(transferid, fileid);

      file.triggerStream(res);
    } catch (err) {
      next(err);
    }
  },
};
