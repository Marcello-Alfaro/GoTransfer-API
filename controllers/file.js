import throwErr from '../helpers/throwErr.js';
import fsp from 'fs/promises';
import File from '../models/file.js';
import Dir from '../models/dir.js';
import User from '../models/user.js';
import sgMail from '@sendgrid/mail';
import formatFileSize from '../helpers/formatFileSize.js';
import sequelize from '../database/connection.js';
import validator from 'validator';
import NotAuthUser from '../models/notAuthUser.js';
import days from '../helpers/days.js';
import io from '../socket.js';
import email from '../helpers/email.js';

let response;
let downloadAllCompleted;
let downloadFileCompleted;

export default {
  async postSendFile(req, res, next) {
    try {
      const { user: { username } = { username: null }, isAuth } = req;
      const { srcEmail, sendTo, title, message, dirId, files, expire = days(5) } = req.body;

      if (!isAuth) {
        if (validator.isEmpty(srcEmail) || !validator.isEmail(srcEmail))
          throwErr('Your email is required and must be a valid email.', 422);

        if (validator.isEmpty(sendTo) || !validator.isEmail(sendTo))
          throwErr('Send to email is required and must be a valid email', 422);

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
                name: entry.originalFilename,
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

        io.getIO().of('/storage-server').emit('send-files', { dirId, title, files: dirFiles });

        io.getServerSocket().once(`transfer-${dirId}-completed`, async () => {
          await sgMail.send(msgToSource);
          await sgMail.send(msgToDest);
          return res.status(200).json({ message: `Files sent successfully to ${sendTo}` });
        });
      }
    } catch (err) {
      (async () =>
        await fsp.rm(
          !req.isAuth
            ? `storage/${req.body.dirId}`
            : `storage/${req.user.username}/${req.body.dirId}`,
          { recursive: true, force: true }
        ))();
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

      const dir = await Dir.findOne({ where: { dirId } });
      const file = await File.findOne({ where: { fileId } });
      if (!dir || !file)
        throwErr('Something went wrong, link expired or files were already downloaded!', 404);

      io.getIO().of('/storage-server').emit('get-file', { dirId, fileId, name: file.name });

      response = res;

      downloadFileCompleted = async () => {
        await file.destroy();
        const filesLeft = await Dir.findOne({ where: { dirId }, include: File });
        if (!filesLeft.Files.length > 0) {
          io.getIO().of('/storage-server').emit(`dir-files-downloaded`, { dirId });
          const dirData = await Dir.findOne({
            where: { dirId },
            include: {
              model: File,
              paranoid: false,
            },
          });
          const msgToSource = email.srcDownloadAll(srcEmail, dstEmail, dirData);
          await sgMail.send(msgToSource);
          return await dirData.destroy();
        }

        const msgToSource = email.srcPartialDownload(srcEmail, dstEmail, dir, file);
        await sgMail.send(msgToSource);
      };

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
      response = res;

      downloadAllCompleted = async () => {
        await dir.destroy();
        const dirData = await Dir.findOne({
          where: { dirId },
          include: { model: File, attributes: ['name', 'size', 'deletedAt'], paranoid: false },
          paranoid: false,
        });
        const msgToSource = email.srcDownloadAll(srcEmail, dstEmail, dirData);
        await sgMail.send(msgToSource);
      };

      return res.attachment(`${title}.zip`);
    } catch (err) {
      next(err);
    }
  },

  getFileStorage(req, res, next) {
    try {
      req.pipe(response);

      response.on('close', () => {
        try {
          res.status(503).json({ success: false });
          throwErr('Connection was closed.', 503);
        } catch (err) {
          next(err);
        }
      });

      response.on('finish', async () => {
        try {
          res.status(200).json({ success: true });
          await downloadFileCompleted();
        } catch (err) {
          next(err);
        }
      });
    } catch (err) {
      throw err;
    }
  },

  getAllFilesStorage(req, res, next) {
    try {
      req.pipe(response);

      response.on('close', () => {
        try {
          res.status(503).json({ success: false });
          throwErr('Connection was closed.', 503);
        } catch (err) {
          next(err);
        }
      });

      response.on('finish', async () => {
        try {
          res.status(200).json({ success: true });
          await downloadAllCompleted();
        } catch (err) {
          next(err);
        }
      });
    } catch (err) {
      throw err;
    }
  },

  async getTransferFiles(req, res, next) {
    try {
      const { dirId, fileId } = req.params;
      const { isAuth } = req;

      if (!isAuth) {
        const file = await File.findOne({ where: { fileId } });
        if (!file) throwErr('Something went wrong, file not found or was already downloaded!', 404);
        const filepath = `storage/${dirId}/${file.name}`;
        return res.download(filepath, async (err) => {
          try {
            if (err) throw err;
            file.set({ transfered: !file.transfered });
            await file.save();
            const filesLeft = await Dir.findOne({
              where: { dirId },
              include: {
                model: File,
                where: { transfered: false },
              },
            });
            if (!filesLeft)
              return await fsp.rm(`storage/${dirId}`, { recursive: true, force: true });
          } catch (err) {
            next(err);
          }
        });
      }
    } catch (err) {
      next(err);
    }
  },
};
