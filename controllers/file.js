import throwErr from '../helpers/throwErr.js';
import File from '../models/file.js';
import Dir from '../models/dir.js';
import User from '../models/user.js';
import sgMail from '@sendgrid/mail';
import formatFileSize from '../helpers/formatFileSize.js';
import sequelize from '../database/connection.js';
import busboy from 'busboy';
import { v4 as uuidv4 } from 'uuid';
import validator from 'validator';
import NotAuthUser from '../models/notAuthUser.js';
import days from '../helpers/days.js';
import io from '../socket.js';
import email from '../helpers/email.js';
import pQueue from 'p-queue';

let executeFileStream;
const downloadHandlers = [];

export default {
  async postSendFile(req, res, next) {
    try {
      const { user: { username } = { username: null }, isAuth } = req;
      const { srcEmail, sendTo, title, message, dirId, files, expire = days(5) } = req.body;

      if (!isAuth) {
        const notAuthUserExists = await NotAuthUser.findOne({
          where: { srcEmail, dstEmail: sendTo },
        });

        const notAuthUser = !notAuthUserExists
          ? await NotAuthUser.create({ srcEmail, dstEmail: sendTo })
          : notAuthUserExists;

        const size = formatFileSize(files.reduce((accum, entry) => (accum += entry.size), 0));
        const dir = await notAuthUser.createDir({ dirId, title, message, size, expire });

        const dirFiles = await Promise.all(
          files.map(
            async (entry) =>
              await dir.createFile({
                name: entry.filename,
                size: formatFileSize(entry.size),
              })
          )
        );

        const msgToSource = email.srcFileSent(srcEmail, sendTo, {
          ...dir.dataValues,
          Files: dirFiles,
        });

        const msgToDest = email.dstFileSent(srcEmail, sendTo, {
          ...dir.dataValues,
          Files: dirFiles,
        });

        await sgMail.send(msgToSource);
        await sgMail.send(msgToDest);

        return res.status(200).json({ message: `Files sent successfully to ${sendTo}` });
      }
    } catch (err) {
      io.getIO().of('/storage-server').emit('unlink-file', { dirId: req.body.dirId });
      next(err);
    }
  },

  async getMyFiles(req, res, next) {
    try {
      const {
        user: { username },
      } = req;
      const currUser = await User.findOne({ where: { username } });
      if (!currUser) throwErr('Current user could not be found!', 404);

      const userFiles = await currUser.getDirs({ include: File });
      if (!userFiles.length > 0) throwErr('No files found for this user.', 404);

      res.status(200).json({ userFiles });
    } catch (err) {
      next(err);
    }
  },

  async getReceivedFiles(req, res, next) {
    try {
      const {
        user: { username },
      } = req;

      const [query] = await sequelize.query(
        `SELECT us.username AS sender, dir.message, dir.dirId, dir.title, dir.expire, dir.createdAt
        FROM Users us
        INNER JOIN Dirs dir
        ON us.id = dir.userId
        INNER JOIN Users_Dirs ud
        ON ud.dirId = dir.id
        INNER JOIN Users usr
        ON usr.id = ud.userId
        WHERE usr.username = ?;`,
        { replacements: [username] }
      );

      if (!query.length > 0) throwErr('No files received for this user.', 404);

      const sentFiles = await Promise.all(
        query.map(async (entry) => {
          return {
            ...entry,
            Files: await (await Dir.findOne({ where: { dirId: entry.dirId } })).getFiles(),
          };
        })
      );

      res.status(200).json({ sentFiles });
    } catch (err) {
      next(err);
    }
  },

  async getFile(req, res, next) {
    try {
      const { dirId, fileId } = req.params;
      const { srcEmail, dstEmail } = req.query;
      if (!srcEmail || !dstEmail) throwErr('Missing aditional information.', 401);

      const dir = await Dir.findOne({ where: { dirId }, include: File });
      const file = await File.findOne({ where: { fileId } });
      if (!dir || !file)
        throwErr('Something went wrong, link expired or files were already downloaded!', 404);

      io.getIO().of('/storage-server').emit('get-file', { dirId, fileId, name: file.name });

      downloadHandlers.push({
        fileId,
        res,
        async downloadFileCompleted() {
          if (dir.Files.length > 1) {
            const msgToSource = email.srcPartialDownload(srcEmail, dstEmail, dir, file);
            return await sgMail.send(msgToSource);
          }
          const msgToSource = email.srcDownloadAll(srcEmail, dstEmail, dir);
          await sgMail.send(msgToSource);
        },
      });

      return res.attachment(file.name);
    } catch (err) {
      next(err);
    }
  },

  async getAllFiles(req, res, next) {
    try {
      const { dirId } = req.params;
      const { srcEmail, dstEmail } = req.query;
      if (!srcEmail || !dstEmail) throwErr('Missing aditional information.', 401);

      const dir = await Dir.findOne({
        where: { dirId },
        include: { model: File, attributes: ['name', 'size'] },
      });

      if (!dir)
        throwErr('Something went wrong, link expired or files were already downloaded!', 404);
      const { title, Files } = dir;

      io.getIO().of('/storage-server').emit('get-all-files', { dirId, title, Files });

      downloadHandlers.push({
        dirId,
        res,
        async downloadFileCompleted() {
          const msgToSource = email.srcDownloadAll(srcEmail, dstEmail, dir);
          await sgMail.send(msgToSource);
        },
      });

      return res.attachment(`${title}.zip`);
    } catch (err) {
      next(err);
    }
  },

  getFileStorage(req, _, next) {
    try {
      const { fileid: fileId } = req.headers;
      const { res, downloadFileCompleted } = downloadHandlers.splice(
        downloadHandlers.findIndex((entry) => (entry.fileId = fileId)),
        1
      )[0];

      req.pipe(res);

      res.on('finish', async () => {
        try {
          await downloadFileCompleted();
        } catch (err) {
          next(err);
        }
      });
    } catch (err) {
      throw err;
    }
  },

  getAllFilesStorage(req, _, next) {
    try {
      const { dirid: dirId } = req.headers;
      const { res, downloadFileCompleted } = downloadHandlers.splice(
        downloadHandlers.findIndex((entry) => (entry.dirId = dirId)),
        1
      )[0];

      req.pipe(res);

      res.on('finish', async () => {
        try {
          await downloadFileCompleted();
        } catch (err) {
          next(err);
        }
      });
    } catch (err) {
      throw err;
    }
  },

  fileHandler(req, _, next) {
    try {
      const { headers, socketId } = req;
      const bytesExpected = +headers['content-length'];
      let bytesReceived = 0;
      let size = 0;
      let speed = 0;
      let fields = {};
      const Busboy = busboy({ headers });
      const workQueue = new pQueue({ concurrency: 1 });
      const dirId = uuidv4();
      const files = [];

      const formHandler = (cb) =>
        workQueue.add(async () => {
          try {
            await cb();
          } catch (err) {
            const { message, status } = err;
            req.unpipe(Busboy);
            workQueue.pause();
            io.getIO().to(socketId).emit('error-uploading', { message, status });
            next(err);
          }
        });

      Busboy.on('field', (field, value) =>
        formHandler(() => {
          fields = { ...fields, [field]: value };

          if (bytesExpected > 15 * 1024 * 1024 * 1024)
            throwErr('File is too big!. Max size per request is 15GB.', 422);

          if (fields.srcEmail)
            if (validator.isEmpty(fields.srcEmail) || !validator.isEmail(fields.srcEmail))
              throwErr('Your email is required and must be a valid email.', 422);

          if (fields.sendTo)
            if (validator.isEmpty(fields.sendTo) || !validator.isEmail(fields.sendTo))
              throwErr('Send to email is required and must be a valid email', 422);
        })
      );

      Busboy.on('file', (_, file, { filename }) =>
        formHandler(() => {
          io.getIO().of('/storage-server').emit('alloc-storage-server', { dirId, filename });
          workQueue.pause();

          executeFileStream = (res) => {
            workQueue.start();

            file.pipe(res);

            file
              .on('data', (chunk) => {
                bytesReceived += chunk.length;
                size += chunk.length;
                speed += chunk.length;
                io.getIO()
                  .to(socketId)
                  .emit('progress', {
                    action: 'progressUpdate',
                    progress: `${Math.round((bytesReceived / bytesExpected) * 100)}%`,
                  });
              })
              .on('close', () => {
                files.push({ filename, size });
                size = 0;
              });
          };
        })
      );

      const uploadSpeed = setInterval(() => {
        io.getIO().to(socketId).emit('progress', { action: 'upload-speed', speed });
        speed = 0;
      }, 1000);

      Busboy.on('finish', () =>
        formHandler(() => {
          clearInterval(uploadSpeed);
          if (!fields.title) fields.title = files[0].filename;
          req.body = { ...fields, dirId, files };
          next();
        })
      );

      Busboy.on('error', (err) => {
        req.unpipe(Busboy);
        clearInterval(uploadSpeed);
        io.getIO().to(socketId).emit('error-uploading', { err });
        next(err);
      });

      req.on('aborted', () => {
        req.unpipe(Busboy);
        clearInterval(uploadSpeed);
        io.getIO().of('/storage-server').emit('unlink-file', { dirId });
      });

      req.pipe(Busboy);
    } catch (err) {
      throw err;
    }
  },

  getTransferFiles(_, res) {
    try {
      executeFileStream(res);
      return res.attachment();
    } catch (err) {
      throw err;
    }
  },
};
