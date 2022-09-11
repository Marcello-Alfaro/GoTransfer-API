import { Op } from 'sequelize';
import throwErr from '../helpers/throwErr.js';
import File from '../models/file.js';
import Dir from '../models/dir.js';
import User from '../models/user.js';
import rimraf from 'rimraf';
import formatFileSize from '../helpers/formatFileSize.js';
import fs from 'fs';
import sequelize from '../database/connection.js';
import JSZip from 'jszip';

export default {
  async postSendFile(req, res, next) {
    try {
      const {
        user: { username },
      } = req;
      const { sendTo, title, message, dirId, files } = req.body;

      const currUser = await User.findOne({ where: { username } });
      if (!currUser) throwErr('Could not found the currently logged user.', 404);

      const sendToUser = await User.findOne({
        where: { [Op.or]: { username: sendTo, email: sendTo } },
      });
      if (!sendToUser) throwErr('Could not found the specified user.', 404);

      const dir = await currUser.createDir({ dirId, title, expire: Date.now() });

      files.forEach(
        async (entry) =>
          await dir.createFile({ name: entry.originalFilename, size: formatFileSize(entry.size) })
      );
      await dir.addUser(sendToUser, { through: { message } });
      res.status(200).json({ message: `Files sent successfully to ${sendTo}.` });
    } catch (err) {
      rimraf(`data/${req.user.username}/${req.body.dirId}`, (err) => err && next(err));
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
        `SELECT us.username AS sender, ud.message, dir.dirId, dir.title, dir.expire, dir.createdAt
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
      const { sender } = req.query;
      const {
        user: { username },
      } = req;

      if (sender) {
        const [query] = await sequelize.query(
          `SELECT us.username AS sender, usr.username AS receiver, ud.message, dir.dirId, dir.title, dir.expire, dir.createdAt
        FROM Users us
        INNER JOIN Dirs dir
        ON us.id = dir.userId
        INNER JOIN Users_Dirs ud
        ON ud.dirId = dir.id
        INNER JOIN Users usr
        ON usr.id = ud.userId
        HAVING receiver = ? && sender = ?
        && dirId = ?;`,
          { replacements: [username, sender, dirId] }
        );
        if (!query.length > 0)
          throwErr('Something went wrong while trying to download the file(s).', 401);

        const file = await File.findOne({ where: { fileId } });
        if (!file) throwErr('File not found.', 404);

        return res.status(200).download(`data/${sender}/${dirId}/${file.name}`);
      }

      const file = await File.findOne({ where: { fileId } });
      if (!file) throwErr('File not found!', 404);
      res.status(200).download(`data/${username}/${dirId}/${file.name}`);
    } catch (err) {
      next(err);
    }
  },

  async getAllFiles(req, res, next) {
    try {
      const { dirId } = req.params;
      const { sender } = req.query;
      const {
        user: { username },
      } = req;

      if (sender) {
        const [query] = await sequelize.query(
          `SELECT us.username AS sender, usr.username AS receiver, ud.message, dir.dirId, dir.title, dir.expire, dir.createdAt
        FROM Users us
        INNER JOIN Dirs dir
        ON us.id = dir.userId
        INNER JOIN Users_Dirs ud
        ON ud.dirId = dir.id
        INNER JOIN Users usr
        ON usr.id = ud.userId
        HAVING receiver = ? && sender = ?
        && dirId = ?;`,
          { replacements: [username, sender, dirId] }
        );

        if (!query.length > 0)
          throwErr('Something went wrong while trying to download the file(s).', 401);

        const dir = await Dir.findOne({ where: { dirId }, include: File });
        if (!dir.Files.length > 0) throwErr('No files were found!', 404);

        const zip = new JSZip();

        dir.Files.forEach((entry) => {
          const filepath = `data/${sender}/${dirId}/${entry.name}`;
          zip.file(entry.name, fs.createReadStream(filepath));
        });

        zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true }).pipe(res);
        return res.attachment(`${dir.title}.zip`);
      }

      const dir = await Dir.findOne({ where: { dirId }, include: File });
      if (!dir.Files.length > 0) throwErr('No files were found!', 404);
      const zip = new JSZip();
      dir.Files.forEach((entry) => {
        const filepath = `data/${username}/${dirId}/${entry.name}`;
        zip.file(entry.name, fs.createReadStream(filepath));
      });
      zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true }).pipe(res);
      res.attachment(`${dir.title}.zip`);
    } catch (err) {
      next(err);
    }
  },
};
