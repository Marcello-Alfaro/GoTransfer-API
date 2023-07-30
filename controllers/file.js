import Request from '../libs/request.js';
import { MAX_FILE_SIZE } from '../config/config.js';
import throwErr from '../helpers/throwErr.js';
import Transfer from '../models/transfer.js';
import File from '../models/file.js';
import Folder from '../models/folder.js';
import UserTransfer from '../models/userTransfer.js';
import sgMail from '@sendgrid/mail';
import { v4 as uuidv4 } from 'uuid';
import validator from 'validator';
import User from '../models/user.js';
import days from '../helpers/days.js';
import io from '../socket.js';
import email from '../helpers/email.js';
import { pipeline } from 'stream/promises';
import busboy from 'busboy';

export default {
  async postSendFile(req, res, next) {
    try {
      const { sender, receivers, title, message, transferId, files, expire = days(5) } = req.body;

      const userExists = await User.findOne({
        where: { email: sender },
      });
      const user = !userExists ? await User.create({ email: sender }) : userExists;

      const transferReceivers = await Promise.all(
        receivers.map(async (receiver) => {
          const user = await User.findOne({ where: { email: receiver } });
          if (!user) return await User.create({ email: receiver });
          return user;
        })
      );

      const size = files.reduce((accum, entry) => (accum += entry?.size ?? entry._size), 0);
      const transfer = await user.createTransfer({ transferId, title, message, size, expire });

      const transferFiles = await Promise.all(
        files.map(async (entry) => {
          if (entry?.fileId)
            return await transfer.createFile({
              fileId: entry.fileId,
              name: entry._name,
              size: entry._size,
              type: entry._type,
            });
          if (entry?.folderId) {
            const folder = await transfer.createFolder({
              folderId: entry.folderId,
              name: entry.name,
              size: entry.size,
              files: entry.files.length,
            });
            folder.Files = await Promise.all(
              entry.files.map(
                async (entry) =>
                  await folder.createFile({
                    fileId: entry.fileId,
                    name: entry._name,
                    size: entry._size,
                    type: entry._type,
                    path: entry._webkitRelativePath,
                  })
              )
            );

            return folder;
          }
        })
      );

      await Promise.all(
        transferReceivers.map(async (receiver) => {
          await transfer.addUser(receiver, { through: UserTransfer });
        })
      );

      if (receivers.length > 1) {
        const msgToSender = email.srcFileSentMultiple(sender, receivers.length, {
          ...transfer.dataValues,
          Files: transferFiles,
        });
        await sgMail.send(msgToSender);

        await Promise.all(
          receivers.map(async (receiver) => {
            const msgToReceiver = email.dstFileSent(sender, receiver, {
              ...transfer.dataValues,
              Files: transferFiles,
            });
            await sgMail.send(msgToReceiver);
          })
        );

        return res.status(201).json({ message: `Your files were sent successfully! 🍧` });
      }

      const msgToSender = email.srcFileSent(sender, receivers[0], {
        ...transfer.dataValues,
        Files: transferFiles,
      });

      const msgToReceiver = email.dstFileSent(sender, receivers[0], {
        ...transfer.dataValues,
        Files: transferFiles,
      });

      await sgMail.send(msgToSender);
      await sgMail.send(msgToReceiver);

      res.status(201).json({ message: `Your files were sent successfully! 🍧` });
    } catch (err) {
      io.getIO().of('/storage-server').emit('unlink-file', { transfer: req.body.transferId });
      next(err);
    }
  },

  async getFile(req, res, next) {
    try {
      const requestId = uuidv4();
      const { transferId, fileId } = req.params;
      const { sender, receiver } = req.query;
      if (!sender || !receiver) throwErr('Missing aditional information.', 401);

      const transfer = await Transfer.findOne({
        where: { transferId },
        include: { model: File, where: { fileId } },
      });

      const { Files = [], Folders = [] } = await Transfer.findOne({
        where: { transferId },
        include: [File, Folder],
      });

      const [file] = transfer.Files;

      transfer.files = [...Files, ...Folders];

      if (!transfer)
        throwErr('Something went wrong, link expired or files were already downloaded!', 404);

      Request.add({
        requestId,
        res,
        async fileDownloadCompleted() {
          if (transfer.files.length > 1) {
            const msgToSender = email.srcPartialDownload(sender, receiver, transfer, file);
            return await sgMail.send(msgToSender);
          }
          const msgToSender = email.srcDownloadAll(sender, receiver, transfer);
          await sgMail.send(msgToSender);
        },
      });

      io.getIO()
        .of('/storage-server')
        .emit('get-file', { requestId, transferId, single: true, fileId });

      return res.attachment(file.name);
    } catch (err) {
      next(err);
    }
  },

  async getFolder(req, res, next) {
    try {
      const requestId = uuidv4();
      const { transferId, folderId } = req.params;
      const { sender, receiver } = req.query;
      if (!sender || !receiver) throwErr('Missing aditional information.', 401);

      const transfer = await Transfer.findOne({
        where: { transferId },
        include: {
          model: Folder,
          where: { folderId },
          include: File,
        },
      });

      if (!transfer)
        throwErr('Something went wrong, link expired or files were already downloaded!', 404);

      const { Files = [], Folders = [] } = await Transfer.findOne({
        where: { transferId },
        include: [File, Folder],
      });

      const [folder] = transfer.Folders;

      const files = [...Files, ...Folders];
      transfer.Files = files;

      Request.add({
        requestId,
        res,
        async fileDownloadCompleted() {
          if (files.length > 1) {
            const msgToSender = email.srcPartialDownload(sender, receiver, transfer, folder);
            return await sgMail.send(msgToSender);
          }
          const msgToSender = email.srcDownloadAll(sender, receiver, transfer);
          await sgMail.send(msgToSender);
        },
      });

      io.getIO()
        .of('/storage-server')
        .emit('get-file', { requestId, transferId, single: true, isfolder: true, folder });

      return res.attachment(`${folder.name}.zip`);
    } catch (err) {
      next(err);
    }
  },

  async getTransfer(req, res, next) {
    try {
      const requestId = uuidv4();
      const { transferId } = req.params;
      const { sender, receiver } = req.query;
      if (!sender || !receiver) throwErr('Missing aditional information.', 401);

      const transfer = await Transfer.findOne({
        where: { transferId },
        include: [File, { model: Folder, include: File }],
      });

      if (!transfer)
        throwErr('Something went wrong, link expired or files were already downloaded!', 404);

      const { title } = transfer;

      transfer.Files = [...transfer.Folders, ...transfer.Files];

      Request.add({
        requestId,
        res,
        async fileDownloadCompleted() {
          const msgToSender = email.srcDownloadAll(sender, receiver, transfer);
          await sgMail.send(msgToSender);
        },
      });

      io.getIO()
        .of('/storage-server')
        .emit('get-file', { requestId, single: false, transferId, transfer });

      return res.attachment(`${title}.zip`);
    } catch (err) {
      next(err);
    }
  },

  async getFileStorage(req, resp, next) {
    try {
      const { requestid } = req.headers;
      const { res, fileDownloadCompleted } = Request.get(requestid);

      await pipeline(req, res);

      resp.sendStatus(200);
      await fileDownloadCompleted();
    } catch (err) {
      next(err);
    }
  },

  getAllocateFile(req, res, next) {
    try {
      const transferId = uuidv4();
      const { sender, receivers, size } = req.body;

      if (validator.isEmpty(sender) || !validator.isEmail(sender))
        throwErr('Your email is required and must be a valid email.', 422);
      if (!receivers?.length > 0) throwErr('There are no receivers to send.', 422);
      receivers.forEach((entry) => {
        if (validator.isEmpty(entry) || !validator.isEmail(entry))
          throwErr('Receiver email is required and must be a valid email.', 422);
      });
      if (size > MAX_FILE_SIZE) throwErr('File is too big! Max file size is 4GB', 422);

      Request.add({ transferId, sender, receivers });

      res.status(200).json(transferId);
    } catch (err) {
      next(err);
    }
  },

  async fileHandler(req, res, next) {
    try {
      const { complete } = req.body;

      if (complete) {
        const { transferId, title, message, files } = req.body;
        const request = Request.get(transferId, 'transferId');
        req.body = { title, message, files, ...request };
        return next();
      }

      const { transferId, filename, part } = req.query;
      Request.queue.find((entry) => entry.transferId === transferId) ??
        throwErr('Something went wrong, try again later', 500);
      const { headers, socketId } = req;
      const filePartId = `${filename}${part}`;
      const bb = busboy({ headers });

      bb.on('file', (_, file) => {
        Request.add({
          requestId: filePartId,
          async filePartStream(res) {
            file.on('data', (chunk) =>
              io.getIO().to(socketId).emit('bytes-received', chunk.length)
            );

            await pipeline(file, res);
          },
        });

        io.getIO()
          .of('/storage-server')
          .emit('alloc-storage-server', { filePartId, transferId, filename });
      });

      await pipeline(req, bb);

      await new Promise((res) => io.getServerSocket().once(filePartId, (ack) => res(ack)));

      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  },

  async getTransferFiles(req, res, next) {
    try {
      const { filepartid } = req.headers;
      const { filePartStream } = Request.get(filepartid);

      await filePartStream(res);
    } catch (err) {
      next(err);
    }
  },
};
