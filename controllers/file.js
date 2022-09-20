import { Op } from 'sequelize';
import throwErr from '../helpers/throwErr.js';
import File from '../models/file.js';
import Dir from '../models/dir.js';
import User from '../models/user.js';
import sgMail from '@sendgrid/mail';
import rimraf from 'rimraf';
import formatFileSize from '../helpers/formatFileSize.js';
import fsp from 'fs/promises';
import sequelize from '../database/connection.js';
import { API_URL, FROM_EMAIL } from '../config/config.js';
import validator from 'validator';
import NotAuthUser from '../models/notAuthUser.js';
import days from '../helpers/days.js';
import io from '../socket.js';
import pump from 'pump';
let response;

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

        const notAuthUser = await NotAuthUser.create({ srcEmail: srcEmail, dstEmail: sendTo });
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

        io.getIO().emit('send-files', { dirId, isAuth, title, dirFiles });

        const msgToSource = {
          to: srcEmail,
          from: FROM_EMAIL,
          subject: `"${title}" was sent to ${sendTo}`,
          html: `<!DOCTYPE html>
          <html
            lang="en"
            xmlns="http://www.w3.org/1999/xhtml"
            xmlns:o="urn:schemas-microsoft-com:office:office"
          >
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width,initial-scale=1" />
              <meta name="x-apple-disable-message-reformatting" />
              <title></title>
              <style>
                table,
                td,
                div,
                h1,
                p {
                  font-family: Arial, sans-serif;
                }
                @media screen and (max-width: 530px) {
                  .unsub {
                    display: block;
                    padding: 8px;
                    margin-top: 14px;
                    border-radius: 6px;
                    background-color: #555555;
                    text-decoration: none !important;
                    font-weight: bold;
                  }
                  .col-lge {
                    max-width: 100% !important;
                  }
                }
                @media screen and (min-width: 531px) {
                  .col-sml {
                    max-width: 27% !important;
                  }
                  .col-lge {
                    max-width: 73% !important;
                  }
                }
          
                .feature-icon {
                  width: 75%;
                  color: #0b7285;
                }
                
                .features-icon {
                  color: #0b7285;
                  width: 10%;
                }

                .logo {
                  display: flex;
                  justify-content: center;
                  margin-bottom: 20px;
                }

                .size {
                  font-size: 18px;
                  margin-top: 0;
                }
          
                a:link, a:visited {
                  text-decoration: none;
                  color: #0b7285;
                }
          
                ol {
                  font-size: 20px;
                }
          
                ol li{
                  margin-bottom: 15px;
                }
          
                ol li:last-of-type {
                  margin-bottom: 0;
                }
              </style>
            </head>
            <body style="margin: 0; padding: 0; word-spacing: normal; background-color: #939297">
              <div
                role="article"
                aria-roledescription="email"
                lang="en"
                style="
                  text-size-adjust: 100%;
                  -webkit-text-size-adjust: 100%;
                  -ms-text-size-adjust: 100%;
                  background-color: #939297;
                "
              >
                <table role="presentation" style="width: 100%; border: none; border-spacing: 0">
                  <tr>
                    <td align="center" style="padding: 0">
                      <table
                        role="presentation"
                        style="
                          width: 94%;
                          max-width: 600px;
                          border: none;
                          border-spacing: 0;
                          text-align: left;
                          font-family: Arial, sans-serif;
                          font-size: 16px;
                          line-height: 22px;
                          color: #363636;
                        "
                      >
                        <tr>
                          <td style="padding: 30px; background-color: #ffffff">
                          <img
                          src="${API_URL}/images/logo.png"
                          width="250"
                          alt="Logo"
                          style="
                            width: 250px;
                            max-width: 80%;
                            height: auto;
                            border: none;
                            text-decoration: none;
                            color: #ffffff;
                            display: block;
                            margin: 0 auto;
                            margin-bottom: 25px;
                          "
                      />
                            <h1
                              style="
                                margin-top: 0;
                                margin-bottom: 16px;
                                font-size: 26px;
                                line-height: 32px;
                                font-weight: bold;
                                letter-spacing: -0.02em;
                              "
                            >
                            Hi ${
                              srcEmail.split('@')[0]
                            }, "${title}" was sent successfully to ${sendTo} with ${
            dirFiles.length > 1 ? `${dirFiles.length} files` : `1 file`
          }:
                            </h1>
                            ${!message ? '' : `<p>${message}</p>`}
                          </td>
                        </tr>         
                        <tr>
                          <td
                            style="
                              padding: 35px 30px 11px 30px;
                              font-size: 0;
                              background-color: #ffffff;
                              border-bottom: 1px solid #f0f0f5;
                              border-color: rgba(201, 201, 207, 0.35);
                            "
                          >
                          <div
                          class="col-sml"
                          style="
                            display: inline-block;
                            width: 100%;
                            max-width: 145px;
                            vertical-align: top;
                            text-align: left;
                            font-family: Arial, sans-serif;
                            font-size: 14px;
                            color: #363636;
                          "
                        >
                          <img
                            src="${API_URL}/images/upload.png"
                            width="115"
                            alt="upload_icon"
                            style="width: 115px; max-width: 80%; margin-bottom: 20px"
                          />
                        </div>
                            <div
                              class="col-lge"
                              style="
                                display: inline-block;
                                width: 100%;
                                max-width: 395px;
                                vertical-align: top;
                                padding-bottom: 20px;
                                font-family: Arial, sans-serif;
                                font-size: 16px;
                                line-height: 22px;
                                color: #363636;
                              "
                            >
                              <ol>
                              ${dirFiles.reduce((accum, entry) => {
                                accum += `<li><strong>${entry.name}</strong>
                                <p class="size">size: ${entry.size}</p>
                                </li>`;
                                return accum;
                              }, '')}
                              </ol>
                              <p style="margin-top: 0; margin-bottom: 18px"></p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                        <td style="padding: 30px; background-color: #ffffff">
                          <p style="margin: 0;">
                            We will notify you when the receiver downloads any of your files.
                          </p>
                        </td>
                      </tr>
                        <tr>
                          <td
                            style="
                              padding: 30px;
                              text-align: center;
                              font-size: 12px;
                              background-color: #404040;
                              color: #cccccc;
                            "
                          >
                            <p style="margin: 0; font-size: 14px; line-height: 20px">
                              Copyright &reg; ${new Date().getFullYear()} FileShake, Marcello Alfaro. All Rights Reserved.<br />
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </body>
          </html>
          `,
        };
        const msgToDest = {
          to: sendTo,
          from: FROM_EMAIL,
          subject: `${srcEmail} sent you "${title}" with ${
            dirFiles.length > 1 ? `${dirFiles.length} files` : `1 file`
          }`,
          html: `<!DOCTYPE html>
          <html
            lang="en"
            xmlns="http://www.w3.org/1999/xhtml"
            xmlns:o="urn:schemas-microsoft-com:office:office"
          >
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width,initial-scale=1" />
              <meta name="x-apple-disable-message-reformatting" />
              <title></title>
              <style>
                table,
                td,
                div,
                h1,
                p {
                  font-family: Arial, sans-serif;
                }
                @media screen and (max-width: 530px) {
                  .unsub {
                    display: block;
                    padding: 8px;
                    margin-top: 14px;
                    border-radius: 6px;
                    background-color: #555555;
                    text-decoration: none !important;
                    font-weight: bold;
                  }
                  .col-lge {
                    max-width: 100% !important;
                  }
                }
                @media screen and (min-width: 531px) {
                  .col-sml {
                    max-width: 27% !important;
                  }
                  .col-lge {
                    max-width: 73% !important;
                  }
                }
          
                .feature-icon {
                  width: 75%;
                  color: #0b7285;
                }
                
                .features-icon {
                  color: #0b7285;
                  width: 10%;
                }

                .logo {
                  display: flex;
                  justify-content: center;
                  margin-bottom: 20px;
                }

                .size {
                  font-size: 18px;
                  margin-top: 0;
                }
          
                a:link, a:visited {
                  text-decoration: none;
                  color: #0b7285;
                }
          
                ol {
                  font-size: 20px;
                }
          
                ol li{
                  margin-bottom: 15px;
                }
          
                ol li:last-of-type {
                  margin-bottom: 0;
                }
              </style>
            </head>
            <body style="margin: 0; padding: 0; word-spacing: normal; background-color: #939297">
              <div
                role="article"
                aria-roledescription="email"
                lang="en"
                style="
                  text-size-adjust: 100%;
                  -webkit-text-size-adjust: 100%;
                  -ms-text-size-adjust: 100%;
                  background-color: #939297;
                "
              >
                <table role="presentation" style="width: 100%; border: none; border-spacing: 0">
                  <tr>
                    <td align="center" style="padding: 0">
                      <table
                        role="presentation"
                        style="
                          width: 94%;
                          max-width: 600px;
                          border: none;
                          border-spacing: 0;
                          text-align: left;
                          font-family: Arial, sans-serif;
                          font-size: 16px;
                          line-height: 22px;
                          color: #363636;
                        "
                      >
                        <tr>
                          <td style="padding: 30px; background-color: #ffffff">
                          <img
                          src="${API_URL}/images/logo.png"
                          width="250"
                          alt="Logo"
                          style="
                            width: 250px;
                            max-width: 80%;
                            height: auto;
                            border: none;
                            text-decoration: none;
                            color: #ffffff;
                            display: block;
                            margin: 0 auto;
                            margin-bottom: 25px;
                          "
                      />
                            <h1
                              style="
                                margin-top: 0;
                                margin-bottom: 16px;
                                font-size: 26px;
                                line-height: 32px;
                                font-weight: bold;
                                letter-spacing: -0.02em;
                              "
                            >
                            Hi there, ${srcEmail} sent you "${title}" with ${
            dirFiles.length > 1 ? `${dirFiles.length} files` : '1 file'
          }.
                            </h1>
                            <p>Total size: ${size}</p>
                            ${!message ? '' : `<p>${message}</p>`}
                          </td>
                        </tr>
          
                        <tr>
                          <td
                            style="
                              padding: 35px 30px 11px 30px;
                              font-size: 0;
                              background-color: #ffffff;
                              border-bottom: 1px solid #f0f0f5;
                              border-color: rgba(201, 201, 207, 0.35);
                            "
                          >
                          <div
                          class="col-sml"
                          style="
                            display: inline-block;
                            width: 100%;
                            max-width: 145px;
                            vertical-align: top;
                            text-align: left;
                            font-family: Arial, sans-serif;
                            font-size: 14px;
                            color: #363636;
                          "
                        >
                          <img
                            src="${API_URL}/images/download.png"
                            width="115"
                            alt="download_icon"
                            style="width: 115px; max-width: 80%; margin-bottom: 20px"
                          />
                        </div>
                            <div
                              class="col-lge"
                              style="
                                display: inline-block;
                                width: 100%;
                                max-width: 395px;
                                vertical-align: top;
                                padding-bottom: 20px;
                                font-family: Arial, sans-serif;
                                font-size: 16px;
                                line-height: 22px;
                                color: #363636;
                              "
                            >
                              <ol>
                              ${dirFiles.reduce((accum, entry) => {
                                accum += `<li><a href="${API_URL}/files/download/${dirId}/${entry.fileId}?isAuth=false&srcEmail=${srcEmail}&dstEmail=${sendTo}">${entry.name}</a>
                                <p class="size">size: ${entry.size}</p>
                                </li>`;
                                return accum;
                              }, '')}
                              </ol>
                              <p style="margin-top: 0; margin-bottom: 18px"></p>
                              <p style="margin: 0">
                              ${
                                dirFiles.length > 1
                                  ? `                                <a
                              href="${API_URL}/files/download/${dirId}?isAuth=false&srcEmail=${srcEmail}&dstEmail=${sendTo}"
                              style="
                                background: #0b7285;
                                text-decoration: none;
                                padding: 10px 25px;
                                color: #ffffff;
                                border-radius: 4px;
                                display: inline-block;
                                mso-padding-alt: 0;
                                text-underline-color: #0b7285;
                              "
                              ><span style="mso-text-raise: 10pt; font-weight: bold"
                                >Download All</span
                              ></a
                            >`
                                  : ''
                              }
                              </p>
                            </div>
                            
                          </td>
                        </tr>
                        <tr>
                        <td style="padding: 30px; background-color: #ffffff">
                          <p style="margin: 0; font-style: italic;">
                            Note: Once you download a file or choose the "Download All" option, the file(s) will be automatically removed from the server.
                            All uploads will have an expiration time of 5 days. Once the time expires, the file(s) will be automatically removed. 
                          </p>
                        </td>
                      </tr>
                        <tr>
                          <td
                            style="
                              padding: 30px;
                              text-align: center;
                              font-size: 12px;
                              background-color: #404040;
                              color: #cccccc;
                            "
                          >
                            <p style="margin: 0; font-size: 14px; line-height: 20px">
                              Copyright &reg; ${new Date().getFullYear()} FileShake, Marcello Alfaro. All Rights Reserved.<br />
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </body>
          </html>
          `,
        };

        await sgMail.send(msgToSource);
        io.getSocket().once('transfer-completed', async () => await sgMail.send(msgToDest));

        return res.status(200).json({ message: `Files sent successfully to ${sendTo}` });
      }

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
      rimraf(
        !req.isAuth ? `data/${req.body.dirId}` : `data/${req.user.username}/${req.body.dirId}`,
        (err) => err && next(err)
      );
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

  /*   async getFile(req, res, next) {
    try {
      const { dirId, fileId } = req.params;
      const { sender, srcEmail, dstEmail } = req.query;
      const { user: { username } = { username: null }, isAuth } = req;

      if (!isAuth) {
        const dir = await Dir.findOne({ where: { dirId }, include: File });
        const file = await File.findOne({ where: { fileId } });
        if (!file) throwErr('Something went wrong, file not found or was already downloaded!', 404);
        const filepath = `data/${dirId}/${file.name}`;
        return res.download(filepath, async (err) => {
          try {
            if (err) throw err;
            await file.destroy();
            await fsp.unlink(filepath);
            const filesLeft = await Dir.findOne({ where: { dirId }, include: File });
            if (!filesLeft.Files.length > 0) {
              await dir.destroy();
              rimraf(`data/${dirId}`, (err) => err && next(err));
            }
            const msgToSource = {
              to: srcEmail,
              from: FROM_EMAIL,
              subject: `${dstEmail} partially downloaded "${dir.title}"`,
              html: `<!DOCTYPE html>
              <html
                lang="en"
                xmlns="http://www.w3.org/1999/xhtml"
                xmlns:o="urn:schemas-microsoft-com:office:office"
              >
                <head>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width,initial-scale=1" />
                  <meta name="x-apple-disable-message-reformatting" />
                  <title></title>
                  <style>
                    table,
                    td,
                    div,
                    h1,
                    p {
                      font-family: Arial, sans-serif;
                    }
                    @media screen and (max-width: 530px) {
                      .unsub {
                        display: block;
                        padding: 8px;
                        margin-top: 14px;
                        border-radius: 6px;
                        background-color: #555555;
                        text-decoration: none !important;
                        font-weight: bold;
                      }
                      .col-lge {
                        max-width: 100% !important;
                      }
                    }
                    @media screen and (min-width: 531px) {
                      .col-sml {
                        max-width: 27% !important;
                      }
                      .col-lge {
                        max-width: 73% !important;
                      }
                    }
              
                    .feature-icon {
                      width: 75%;
                      color: #0b7285;
                    }
                    
                    .features-icon {
                      color: #0b7285;
                      width: 10%;
                    }
    
                    .logo {
                      display: flex;
                      justify-content: center;
                      margin-bottom: 20px;
                    }
    
                    .size {
                      font-size: 18px;
                      margin-top: 0;
                    }
              
                    a:link, a:visited {
                      text-decoration: none;
                      color: #0b7285;
                    }
              
                    ol {
                      font-size: 20px;
                    }
              
                    ol li{
                      margin-bottom: 15px;
                    }
              
                    ol li:last-of-type {
                      margin-bottom: 0;
                    }
                  </style>
                </head>
                <body style="margin: 0; padding: 0; word-spacing: normal; background-color: #939297">
                  <div
                    role="article"
                    aria-roledescription="email"
                    lang="en"
                    style="
                      text-size-adjust: 100%;
                      -webkit-text-size-adjust: 100%;
                      -ms-text-size-adjust: 100%;
                      background-color: #939297;
                    "
                  >
                    <table role="presentation" style="width: 100%; border: none; border-spacing: 0">
                      <tr>
                        <td align="center" style="padding: 0">
                          <table
                            role="presentation"
                            style="
                              width: 94%;
                              max-width: 600px;
                              border: none;
                              border-spacing: 0;
                              text-align: left;
                              font-family: Arial, sans-serif;
                              font-size: 16px;
                              line-height: 22px;
                              color: #363636;
                            "
                          >
                            <tr>
                              <td style="padding: 30px; background-color: #ffffff">
                              <img
                              src="${API_URL}/images/logo.png"
                              width="250"
                              alt="Logo"
                              style="
                                width: 250px;
                                max-width: 80%;
                                height: auto;
                                border: none;
                                text-decoration: none;
                                color: #ffffff;
                                display: block;
                                margin: 0 auto;
                                margin-bottom: 25px;
                              "
                          />
                                <h1
                                  style="
                                    margin-top: 0;
                                    margin-bottom: 16px;
                                    font-size: 26px;
                                    line-height: 32px;
                                    font-weight: bold;
                                    letter-spacing: -0.02em;
                                  "
                                >
                                Hello, this email is to notify you that ${dstEmail} downloaded one of the files in "${
                dir.title
              }".
                                </h1>
                              </td>
                            </tr>
                            <tr>
                              <td
                                style="
                                  padding: 35px 30px 11px 30px;
                                  font-size: 0;
                                  background-color: #ffffff;
                                  border-bottom: 1px solid #f0f0f5;
                                  border-color: rgba(201, 201, 207, 0.35);
                                "
                              >
                              <div
                              class="col-sml"
                              style="
                                display: inline-block;
                                width: 100%;
                                max-width: 145px;
                                vertical-align: top;
                                text-align: left;
                                font-family: Arial, sans-serif;
                                font-size: 14px;
                                color: #363636;
                              "
                            >
                              <img
                                src="${API_URL}/images/check.png"
                                width="115"
                                alt="check_icon"
                                style="width: 115px; max-width: 80%; margin-bottom: 20px"
                              />
                            </div>
                                <div
                                  class="col-lge"
                                  style="
                                    display: inline-block;
                                    width: 100%;
                                    max-width: 395px;
                                    vertical-align: top;
                                    padding-bottom: 20px;
                                    font-family: Arial, sans-serif;
                                    font-size: 16px;
                                    line-height: 22px;
                                    color: #363636;
                                  "
                                >
                                  <ul>
                                  <li><strong>${file.name}</strong>
                                    <p class="size">size: ${file.size}</p>
                                    </li>
                                  </ul>
                                  <p style="margin-top: 0; margin-bottom: 18px"></p>
                                </div>
                              </td>
                            </tr>
                            <tr>
                            <td style="padding: 30px; background-color: #ffffff">
                              <p style="margin: 0;">
                                We will notify you when the receiver downloads any of your files.
                              </p>
                            </td>
                          </tr>
                            <tr>
                              <td
                                style="
                                  padding: 30px;
                                  text-align: center;
                                  font-size: 12px;
                                  background-color: #404040;
                                  color: #cccccc;
                                "
                              >
                                <p style="margin: 0; font-size: 14px; line-height: 20px">
                                  Copyright &reg; ${new Date().getFullYear()} FileShake, Marcello Alfaro. All Rights Reserved.<br />
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </div>
                </body>
              </html>
              `,
            };
            await sgMail.send(msgToSource);
          } catch (err) {
            next(err);
          }
        });
      }

      if (sender) {
        const [query] = await sequelize.query(
          `SELECT us.username AS sender, usr.username AS receiver, dir.message, dir.dirId, dir.title, dir.expire, dir.createdAt
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
 */

  async getFile(req, res) {
    const { dirId, fileId } = req.params;
    const { name } = await File.findOne({ where: { fileId } });
    io.getIO().emit('get-file', { dirId, fileId, name });
    response = res;
    return res.attachment(name);
  },

  async getAllFiles(req, res, next) {
    try {
      const { dirId } = req.params;
      const { srcEmail, dstEmail } = req.query;
      const dir = await Dir.findOne({
        where: { dirId },
        include: { model: File, attributes: ['name'] },
      });
      if (!dir)
        throwErr('Something went wrong, link is invalid or files were already downloaded!', 404);
      const { title, Files } = dir;
      io.getIO().emit('get-all-files', { dirId, title, Files });
      response = res;
      io.getSocket().once('download-finished', async () => {
        await dir.destroy();
        const msgToSource = {
          to: srcEmail,
          from: FROM_EMAIL,
          subject: `${dstEmail} downloaded "${dir.title}" and all its files`,
          html: `<!DOCTYPE html>
          <html
            lang="en"
            xmlns="http://www.w3.org/1999/xhtml"
            xmlns:o="urn:schemas-microsoft-com:office:office"
          >
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width,initial-scale=1" />
              <meta name="x-apple-disable-message-reformatting" />
              <title></title>
              <style>
                table,
                td,
                div,
                h1,
                p {
                  font-family: Arial, sans-serif;
                }
                @media screen and (max-width: 530px) {
                  .unsub {
                    display: block;
                    padding: 8px;
                    margin-top: 14px;
                    border-radius: 6px;
                    background-color: #555555;
                    text-decoration: none !important;
                    font-weight: bold;
                  }
                  .col-lge {
                    max-width: 100% !important;
                  }
                }
                @media screen and (min-width: 531px) {
                  .col-sml {
                    max-width: 27% !important;
                  }
                  .col-lge {
                    max-width: 73% !important;
                  }
                }
          
                .feature-icon {
                  width: 75%;
                  color: #0b7285;
                }
                
                .features-icon {
                  color: #0b7285;
                  width: 10%;
                }

                .logo {
                  display: flex;
                  justify-content: center;
                  margin-bottom: 20px;
                }

                .size {
                  font-size: 18px;
                  margin-top: 0;
                }
          
                a:link, a:visited {
                  text-decoration: none;
                  color: #0b7285;
                }
          
                ol {
                  font-size: 20px;
                }
          
                ol li{
                  margin-bottom: 15px;
                }
          
                ol li:last-of-type {
                  margin-bottom: 0;
                }
              </style>
            </head>
            <body style="margin: 0; padding: 0; word-spacing: normal; background-color: #939297">
              <div
                role="article"
                aria-roledescription="email"
                lang="en"
                style="
                  text-size-adjust: 100%;
                  -webkit-text-size-adjust: 100%;
                  -ms-text-size-adjust: 100%;
                  background-color: #939297;
                "
              >
                <table role="presentation" style="width: 100%; border: none; border-spacing: 0">
                  <tr>
                    <td align="center" style="padding: 0">
                      <table
                        role="presentation"
                        style="
                          width: 94%;
                          max-width: 600px;
                          border: none;
                          border-spacing: 0;
                          text-align: left;
                          font-family: Arial, sans-serif;
                          font-size: 16px;
                          line-height: 22px;
                          color: #363636;
                        "
                      >
                        <tr>
                          <td style="padding: 30px; background-color: #ffffff">
                          <img
                          src="${API_URL}/images/logo.png"
                          width="250"
                          alt="Logo"
                          style="
                            width: 250px;
                            max-width: 80%;
                            height: auto;
                            border: none;
                            text-decoration: none;
                            color: #ffffff;
                            display: block;
                            margin: 0 auto;
                            margin-bottom: 25px;
                          "
                      />
                            <h1
                              style="
                                margin-top: 0;
                                margin-bottom: 16px;
                                font-size: 26px;
                                line-height: 32px;
                                font-weight: bold;
                                letter-spacing: -0.02em;
                              "
                            >
                            Hey there, this email is to notify you that ${dstEmail} successfully downloaded "${
            dir.title
          }" and its ${dir.Files.length > 1 ? `${dir.Files.length} files` : '1 file'}.
                            </h1>
                          </td>
                        </tr>            
                        <tr>
                          <td
                            style="
                              padding: 35px 30px 11px 30px;
                              font-size: 0;
                              background-color: #ffffff;
                              border-bottom: 1px solid #f0f0f5;
                              border-color: rgba(201, 201, 207, 0.35);
                            "
                          >
                          <div
                          class="col-sml"
                          style="
                            display: inline-block;
                            width: 100%;
                            max-width: 145px;
                            vertical-align: top;
                            text-align: left;
                            font-family: Arial, sans-serif;
                            font-size: 14px;
                            color: #363636;
                          "
                        >
                          <img
                            src="${API_URL}/images/check.png"
                            width="115"
                            alt="check_icon"
                            style="width: 115px; max-width: 80%; margin-bottom: 20px"
                          />
                        </div>
                            <div
                              class="col-lge"
                              style="
                                display: inline-block;
                                width: 100%;
                                max-width: 395px;
                                vertical-align: top;
                                padding-bottom: 20px;
                                font-family: Arial, sans-serif;
                                font-size: 16px;
                                line-height: 22px;
                                color: #363636;
                              "
                            >
                              <ol>
                              ${dir.Files.reduce((accum, entry) => {
                                accum += `<li><strong>${entry.name}</strong>
                                <p class="size">size: ${entry.size}</p>
                                </li>`;
                                return accum;
                              }, '')}
                              </ol>
                              <p style="margin-top: 0; margin-bottom: 18px"></p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                        <td style="padding: 30px; background-color: #ffffff">
                          <p style="margin: 0;">
                            We will notify you when the receiver downloads any of your files.
                          </p>
                        </td>
                      </tr>
                        <tr>
                          <td
                            style="
                              padding: 30px;
                              text-align: center;
                              font-size: 12px;
                              background-color: #404040;
                              color: #cccccc;
                            "
                          >
                            <p style="margin: 0; font-size: 14px; line-height: 20px">
                              Copyright &reg; ${new Date().getFullYear()} FileShake, Marcello Alfaro. All Rights Reserved.<br />
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </body>
          </html>
          `,
        };
        await sgMail.send(msgToSource);
      });
      return res.attachment(`${title}.zip`);
    } catch (err) {
      next(err);
    }
  },

  async getFileStorage(req, res) {
    pump(req, response, (err) => {
      if (err) return next(err);
      res.status(200).json({ success: true });
    });
  },

  async getAllFilesStorage(req, res) {
    pump(req, response, (err) => {
      if (err) return next(err);
      res.status(200).json({ success: true });
    });
  },

  async getTransferFiles(req, res, next) {
    try {
      const { dirId, fileId } = req.params;
      const { isAuth } = req;

      if (!isAuth) {
        const file = await File.findOne({ where: { fileId } });
        if (!file) throwErr('Something went wrong, file not found or was already downloaded!', 404);
        const filepath = `data/${dirId}/${file.name}`;
        return res.download(filepath, async (err) => {
          try {
            if (err) throw err;
            await fsp.unlink(filepath);
            if (!(await fsp.readdir(`data/${dirId}`)).length > 0)
              rimraf(`data/${dirId}`, (err) => err && next(err));
          } catch (err) {
            next(err);
          }
        });
      }
    } catch (err) {
      next(err);
    }
  },

  /*   async getAllFiles(req, res, next) {
    try {
      const { dirId } = req.params;
      const { sender, srcEmail, dstEmail } = req.query;
      const { user: { username } = { username: null }, isAuth } = req;

      if (!isAuth) {
        const dir = await Dir.findOne({ where: { dirId }, include: File });
        if (!dir)
          throwErr('Something went wrong, link is invalid or files are no longer available', 404);
        const zip = new JSZip();
        const folder = zip.folder(dir.title);
        dir.Files.forEach((entry) =>
          folder.file(entry.name, fs.createReadStream(`data/${dirId}/${entry.name}`))
        );

        zip
          .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
          .pipe(res)
          .on('finish', async () => {
            try {
              await dir.destroy();
              rimraf(`data/${dirId}`, async (err) => err && next(err));
              const msgToSource = {
                to: srcEmail,
                from: FROM_EMAIL,
                subject: `${dstEmail} downloaded "${dir.title}" and all its files`,
                html: `<!DOCTYPE html>
                <html
                  lang="en"
                  xmlns="http://www.w3.org/1999/xhtml"
                  xmlns:o="urn:schemas-microsoft-com:office:office"
                >
                  <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width,initial-scale=1" />
                    <meta name="x-apple-disable-message-reformatting" />
                    <title></title>
                    <style>
                      table,
                      td,
                      div,
                      h1,
                      p {
                        font-family: Arial, sans-serif;
                      }
                      @media screen and (max-width: 530px) {
                        .unsub {
                          display: block;
                          padding: 8px;
                          margin-top: 14px;
                          border-radius: 6px;
                          background-color: #555555;
                          text-decoration: none !important;
                          font-weight: bold;
                        }
                        .col-lge {
                          max-width: 100% !important;
                        }
                      }
                      @media screen and (min-width: 531px) {
                        .col-sml {
                          max-width: 27% !important;
                        }
                        .col-lge {
                          max-width: 73% !important;
                        }
                      }
                
                      .feature-icon {
                        width: 75%;
                        color: #0b7285;
                      }
                      
                      .features-icon {
                        color: #0b7285;
                        width: 10%;
                      }
      
                      .logo {
                        display: flex;
                        justify-content: center;
                        margin-bottom: 20px;
                      }
      
                      .size {
                        font-size: 18px;
                        margin-top: 0;
                      }
                
                      a:link, a:visited {
                        text-decoration: none;
                        color: #0b7285;
                      }
                
                      ol {
                        font-size: 20px;
                      }
                
                      ol li{
                        margin-bottom: 15px;
                      }
                
                      ol li:last-of-type {
                        margin-bottom: 0;
                      }
                    </style>
                  </head>
                  <body style="margin: 0; padding: 0; word-spacing: normal; background-color: #939297">
                    <div
                      role="article"
                      aria-roledescription="email"
                      lang="en"
                      style="
                        text-size-adjust: 100%;
                        -webkit-text-size-adjust: 100%;
                        -ms-text-size-adjust: 100%;
                        background-color: #939297;
                      "
                    >
                      <table role="presentation" style="width: 100%; border: none; border-spacing: 0">
                        <tr>
                          <td align="center" style="padding: 0">
                            <table
                              role="presentation"
                              style="
                                width: 94%;
                                max-width: 600px;
                                border: none;
                                border-spacing: 0;
                                text-align: left;
                                font-family: Arial, sans-serif;
                                font-size: 16px;
                                line-height: 22px;
                                color: #363636;
                              "
                            >
                              <tr>
                                <td style="padding: 30px; background-color: #ffffff">
                                <img
                                src="${API_URL}/images/logo.png"
                                width="250"
                                alt="Logo"
                                style="
                                  width: 250px;
                                  max-width: 80%;
                                  height: auto;
                                  border: none;
                                  text-decoration: none;
                                  color: #ffffff;
                                  display: block;
                                  margin: 0 auto;
                                  margin-bottom: 25px;
                                "
                            />
                                  <h1
                                    style="
                                      margin-top: 0;
                                      margin-bottom: 16px;
                                      font-size: 26px;
                                      line-height: 32px;
                                      font-weight: bold;
                                      letter-spacing: -0.02em;
                                    "
                                  >
                                  Hey there, this email is to notify you that ${dstEmail} successfully downloaded "${
                  dir.title
                }" and its ${dir.Files.length > 1 ? `${dir.Files.length} files` : '1 file'}.
                                  </h1>
                                </td>
                              </tr>            
                              <tr>
                                <td
                                  style="
                                    padding: 35px 30px 11px 30px;
                                    font-size: 0;
                                    background-color: #ffffff;
                                    border-bottom: 1px solid #f0f0f5;
                                    border-color: rgba(201, 201, 207, 0.35);
                                  "
                                >
                                <div
                                class="col-sml"
                                style="
                                  display: inline-block;
                                  width: 100%;
                                  max-width: 145px;
                                  vertical-align: top;
                                  text-align: left;
                                  font-family: Arial, sans-serif;
                                  font-size: 14px;
                                  color: #363636;
                                "
                              >
                                <img
                                  src="${API_URL}/images/check.png"
                                  width="115"
                                  alt="check_icon"
                                  style="width: 115px; max-width: 80%; margin-bottom: 20px"
                                />
                              </div>
                                  <div
                                    class="col-lge"
                                    style="
                                      display: inline-block;
                                      width: 100%;
                                      max-width: 395px;
                                      vertical-align: top;
                                      padding-bottom: 20px;
                                      font-family: Arial, sans-serif;
                                      font-size: 16px;
                                      line-height: 22px;
                                      color: #363636;
                                    "
                                  >
                                    <ol>
                                    ${dir.Files.reduce((accum, entry) => {
                                      accum += `<li><strong>${entry.name}</strong>
                                      <p class="size">size: ${entry.size}</p>
                                      </li>`;
                                      return accum;
                                    }, '')}
                                    </ol>
                                    <p style="margin-top: 0; margin-bottom: 18px"></p>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                              <td style="padding: 30px; background-color: #ffffff">
                                <p style="margin: 0;">
                                  We will notify you when the receiver downloads any of your files.
                                </p>
                              </td>
                            </tr>
                              <tr>
                                <td
                                  style="
                                    padding: 30px;
                                    text-align: center;
                                    font-size: 12px;
                                    background-color: #404040;
                                    color: #cccccc;
                                  "
                                >
                                  <p style="margin: 0; font-size: 14px; line-height: 20px">
                                    Copyright &reg; ${new Date().getFullYear()} FileShake, Marcello Alfaro. All Rights Reserved.<br />
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </body>
                </html>
                `,
              };
              await sgMail.send(msgToSource);
            } catch (err) {
              next(err);
            }
          });
        return res.attachment(`${dir.title}.zip`);
      }

      if (sender) {
        const [query] = await sequelize.query(
          `SELECT us.username AS sender, usr.username AS receiver, dir.message, dir.dirId, dir.title, dir.expire, dir.createdAt
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
  }, */
};
