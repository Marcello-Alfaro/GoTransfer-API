import { Op } from 'sequelize';
import NotAuthUser from '../models/notAuthUser.js';
import Dir from '../models/dir.js';
import File from '../models/file.js';
import { FROM_EMAIL, API_URL } from '../config/config.js';
import days from './days.js';
import sgMail from '@sendgrid/mail';
import rimraf from 'rimraf';

export default () => {
  try {
    setInterval(async () => {
      const filesAboutExpire = await Dir.findAll({
        where: {
          expire: { [Op.lt]: days(1) },
          warned: false,
        },
        include: NotAuthUser,
      });

      const expiredFiles = await Dir.findAll({
        where: { expire: { [Op.lt]: Date.now() }, warned: true },
      });

      if (filesAboutExpire.length > 0) {
        filesAboutExpire.forEach(async (entry) => {
          const { dirId, title, message } = entry;
          const { srcEmail, dstEmail } = entry.NotAuthUser;
          const { Files } = await Dir.findByPk(entry.id, { include: File });
          entry.set({ warned: !entry.warned });
          await entry.save();
          const msgToDest = {
            to: dstEmail,
            from: FROM_EMAIL,
            subject: `Hey there ${dstEmail.split('@')[0]}, your files are about to expire!`,
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
                          <a href="" style="text-decoration: none"
                          ><img
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
                      /></a>
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
                            Hello ${
                              dstEmail.split('@')[0]
                            }, the following files sent by ${srcEmail} are about to expire in 1 day.
                            </h1>
                            <p style="margin-bottom: 10px">
                              Title: ${title}
                            </p>
                            ${
                              !message
                                ? ''
                                : `<p style="margin-bottom: 10px">
                            Message: ${message}
                          </p>`
                            }
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
                              ${Files.reduce((accum, entry) => {
                                accum += `<li><a href="${API_URL}/files/download/${dirId}/${entry.fileId}?isAuth=false&srcEmail=${srcEmail}&dstEmail=${dstEmail}">${entry.name}</a>
                                <p class="size">size: ${entry.size}</p>
                                </li>`;
                                return accum;
                              }, '')}
                              </ol>
                              <p style="margin-top: 0; margin-bottom: 18px"></p>
                              <p style="margin: 0">
                              ${
                                Files.length > 1
                                  ? `                                <a
                              href="${API_URL}/files/download/${dirId}?isAuth=false&srcEmail=${srcEmail}&dstEmail=${dstEmail}"
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
          await sgMail.send(msgToDest);
        });
      }

      if (expiredFiles.length > 0) {
        expiredFiles.forEach(async (entry) => {
          await entry.destroy();
          rimraf(`data/${entry.dirId}`, (err) => err);
        });
      }
    }, 1000);
  } catch (err) {
    throw err;
  }
};
