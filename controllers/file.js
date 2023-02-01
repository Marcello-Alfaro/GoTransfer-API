import Request from '../libs/request.js';
import { MAX_FILE_SIZE } from '../config/config.js';
import throwErr from '../helpers/throwErr.js';
import File from '../models/file.js';
import Dir from '../models/dir.js';
import Fileshake from '../models/fileshake.js';
import sgMail from '@sendgrid/mail';
import formatFileSize from '../helpers/formatFileSize.js';
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
      const { sender, receivers, title, message, dirId, files, expire = days(5) } = req.body;

      const userExists = await User.findOne({
        where: { email: sender },
      });
      const user = !userExists ? await User.create({ email: sender }) : userExists;

      const dirReceivers = await Promise.all(
        receivers.map(async (receiver) => {
          const user = await User.findOne({ where: { email: receiver } });
          if (!user) return await User.create({ email: receiver });
          return user;
        })
      );

      const size = formatFileSize(files.reduce((accum, entry) => (accum += entry.size), 0));
      const dir = await user.createDir({ dirId, title, message, size, expire });

      const dirFiles = await Promise.all(
        files.map(
          async (entry) =>
            await dir.createFile({
              fileId: entry.fileId,
              name: entry.name,
              size: formatFileSize(entry.size),
              rawsize: entry.size,
            })
        )
      );

      await Promise.all(
        dirReceivers.map(async (receiver) => {
          await dir.addUser(receiver, { through: Fileshake });
        })
      );

      if (receivers.length > 1) {
        const msgToSender = email.srcFileSentMultiple(sender, receivers.length, {
          ...dir.dataValues,
          Files: dirFiles,
        });
        await sgMail.send(msgToSender);

        await Promise.all(
          receivers.map(async (receiver) => {
            const msgToReceiver = email.dstFileSent(sender, receiver, {
              ...dir.dataValues,
              Files: dirFiles,
            });
            await sgMail.send(msgToReceiver);
          })
        );

        return res.status(201).json({ message: `Your files were sent successfully! 🍧` });
      }

      const msgToSender = email.srcFileSent(sender, receivers[0], {
        ...dir.dataValues,
        Files: dirFiles,
      });

      const msgToReceiver = email.dstFileSent(sender, receivers[0], {
        ...dir.dataValues,
        Files: dirFiles,
      });

      await sgMail.send(msgToSender);
      await sgMail.send(msgToReceiver);

      res.status(201).json({ message: `Your files were sent successfully! 🍧` });
    } catch (err) {
      io.getIO().of('/storage-server').emit('unlink-file', { dirId: req.body.dirId });
      next(err);
    }
  },

  async getFile(req, res, next) {
    try {
      const requestId = uuidv4();
      const { dirId, fileId } = req.params;
      const { sender, receiver } = req.query;
      if (!sender || !receiver) throwErr('Missing aditional information.', 401);

      const dir = await Dir.findOne({ where: { dirId }, include: File });
      const file = await File.findOne({ where: { fileId }, attributes: ['name'] });
      if (!dir || !file)
        throwErr('Something went wrong, link expired or files were already downloaded!', 404);

      io.getIO().of('/storage-server').emit('get-file', { requestId, dirId, single: true, fileId });

      Request.add({
        requestId,
        res,
        async fileDownloadCompleted() {
          if (dir.Files.length > 1) {
            const msgToSender = email.srcPartialDownload(sender, receiver, dir, file);
            return await sgMail.send(msgToSender);
          }
          const msgToSender = email.srcDownloadAll(sender, receiver, dir);
          await sgMail.send(msgToSender);
        },
      });

      return res.attachment(file.name);
    } catch (err) {
      next(err);
    }
  },

  async getAllFiles(req, res, next) {
    try {
      const requestId = uuidv4();
      const { dirId } = req.params;
      const { sender, receiver } = req.query;
      if (!sender || !receiver) throwErr('Missing aditional information.', 401);

      const dir = await Dir.findOne({
        where: { dirId },
        include: { model: File, attributes: ['fileId', 'name', 'size'] },
      });

      if (!dir)
        throwErr('Something went wrong, link expired or files were already downloaded!', 404);
      const { title, Files } = dir;

      io.getIO()
        .of('/storage-server')
        .emit('get-file', { requestId, single: false, dirId, title, Files });

      Request.add({
        requestId,
        res,
        async fileDownloadCompleted() {
          const msgToSender = email.srcDownloadAll(sender, receiver, dir);
          await sgMail.send(msgToSender);
        },
      });

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

  getAllocateFile(req, res) {
    const { sender, receivers, size } = req.body;

    if (validator.isEmpty(sender) || !validator.isEmail(sender))
      throwErr('Your email is required and must be a valid email.', 422);
    if (!receivers?.length > 0) throwErr('There are no receivers to send.', 422);
    receivers.forEach((entry) => {
      if (validator.isEmpty(entry) || !validator.isEmail(entry))
        throwErr('Receiver email is required and must be a valid email.', 422);
    });
    if (size > MAX_FILE_SIZE) throwErr('File is too big! Max file size is 6GB', 422);

    const requestId = uuidv4();

    Request.add({ requestId, dirId: uuidv4(), sender, receivers, files: [] });

    res.status(200).json(requestId);
  },

  async fileHandler(req, res, next) {
    try {
      const { fileComplete, complete } = req.body;

      if (fileComplete) {
        const { requestId, fileId, name, size } = req.body;
        const { files } =
          Request.queue.find((entry) => entry.requestId === requestId) ??
          throwErr('Something went wrong, try again later', 422);

        files.push({ fileId, name, size });
        return res.sendStatus(200);
      }

      if (complete) {
        const { requestId, title, message } = req.body;
        const request = Request.get(requestId);
        req.body = { title: !title ? request.files[0].name : title, message, ...request };

        return next();
      }

      const { requestId, filename, part } = req.query;
      const { dirId } =
        Request.queue.find((entry) => entry.requestId === requestId) ??
        throwErr('Something went wrong, try again later', 500);
      const { headers, socketId } = req;
      const filePartId = `${filename}${part}`;
      const bb = busboy({ headers });

      bb.on('file', (_, file) => {
        io.getIO()
          .of('/storage-server')
          .emit('alloc-storage-server', { filePartId, dirId, filename });

        Request.add({
          requestId: filePartId,
          async filePartStream(res) {
            file.on('data', (chunk) =>
              io.getIO().to(socketId).emit('bytes-received', chunk.length)
            );

            await pipeline(file, res);
          },
        });
      });

      await pipeline(req, bb);

      await new Promise((res, _) => io.getServerSocket().once(filePartId, (ack) => res(ack)));

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
