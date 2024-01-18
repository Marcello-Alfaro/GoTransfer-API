import {
  API_URL,
  API_PATH,
  FROM_EMAIL,
  TRANSFER_EXPIRE_TIME,
  SENDGRID_API_KEY,
} from '../config/config.js';
import sgMail from '@sendgrid/mail';
import ErrorObject from '../helpers/errorObject.js';

sgMail.setApiKey(SENDGRID_API_KEY);

export default class Email {
  from = FROM_EMAIL;
  #dateOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  #timeOptions = { hour: 'numeric', minute: 'numeric' };

  constructor(to, transfer) {
    if (this.constructor === Email)
      throw new ErrorObject("Class is of abstract type and can't be instantiated");
    this.to = to;
    this.transfer = transfer;
    this.formatTransferFiles();
  }

  formatTransferFiles() {
    this.files = [
      ...(this.transfer?.Folders ?? this.transfer?.folders ?? []),
      ...(this.transfer?.Files ?? this.transfer?.files ?? []),
    ];
  }

  formatFileSize(size) {
    if (`${size}`.length > 9) return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (`${size}`.length > 6) return `${Math.round(size / (1024 * 1024))} MB`;
    return `${Math.round(size / 1024)} KB`;
  }

  async send() {
    try {
      await sgMail.send(this);
    } catch (err) {
      throw err;
    }
  }

  buildEmail(section1, section2) {
    this.html = `<!DOCTYPE html>
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
  color: #228be6;
}

.features-icon {
  color: #228be6;
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

.downloadedAt {
  font-size: 16px;
  font-style: italic;
}

.downloaded {
  text-decoration: line-through;
}

.info-block {
  margin-bottom: 1.2em;
  background-color: #e9f3fd;
  padding: 1em;
  border-radius: 9px;
}

.info-block:last-of-type {
  margin-bottom: 0;
}

.receivers-list {
  font-size: 1em;
  column-count: 2;
}

.receivers-list li:last-of-type {
  list-style: none;
}

a:link, a:visited {
  text-decoration: none;
  color: #228be6;
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
                    src="${API_URL + API_PATH}/images/logo.png"
                    width="250"
                    alt="Logo"
                    style="
                      width: 250px;
                      max-width: 80%;
                      height: auto;
                      border: none;
                      border-radius: 9px;
                      text-decoration: none;
                      color: #ffffff;
                      display: block;
                      margin: 0 auto;
                      margin-bottom: 25px;
                    "
                />
                ${section1}

                ${
                  !this.transfer.message
                    ? ''
                    : `<div class="info-block">
              <p
                style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 0.5em"
              >
                Sender's message
              </p>
              <span style="font-size: 18px"
                >${this.transfer.message}</span
              >
            </div>`
                }

                ${
                  !this.expired
                    ? `
                    <div class="info-block">
                <p
                  style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 0.5em"
                >
                  Expiration
                </p>
                <span style="font-size: 18px"
                  >${
                    this.files.length > 1 ? 'These files are' : 'This file is'
                  } available for download until ${new Date(
                        this.transfer.expire
                      ).toLocaleDateString('en-US', this.#dateOptions)} at ${new Date(
                        this.transfer.expire
                      ).toLocaleTimeString('en-US', this.#timeOptions)}.</span
                >
              </div>`
                    : ''
                }
                </td>
                <tr>
                    <td
                      style="
                        padding: 0 30px 11px 30px;
                        font-size: 0;
                        background-color: #ffffff;
                        border-bottom: 1px solid #f0f0f5;
                        border-color: rgba(201, 201, 207, 0.35);
                      "
                    >
                    <p style="margin-bottom: 2.4em">
<span style="font-size: 20px; font-weight: 600; padding-right: 0.4em"
  >Total size:</span
><span style="font-size: 18px">${this.formatFileSize(this.transfer.size)} (${this.files.length} ${
      this.files.length > 1 ? 'files' : 'file'
    })</span>
</p>
                    <div
                    class="col-sml"
                    style="
                      display: inline-block;
                      width: 100%;
                      padding-top: 20px;
                      max-width: 145px;
                      vertical-align: top;
                      text-align: left;
                      font-family: Arial, sans-serif;
                      font-size: 14px;
                      color: #363636;
                    "
                  >
                    <img
                      src="${API_URL + API_PATH}/images/${this.image}"
                      width="115"
                      alt="expire_icon"
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
                        ${section2}
                        </div>
                    </td>
                  </tr>
                  <td style="padding: 30px; background-color: #ffffff">
                    <p style="margin: 0; font-style: italic;">
                      Note: All uploads will have an expiration time of ${TRANSFER_EXPIRE_TIME} days. Once the time expires, the file(s) will be automatically removed. 
                    </p>
                  </td>
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
                        Copyright &reg; ${new Date().getFullYear()} GoTransfer, A forget it Jake production. Designed and developed by Marcello Alfaro. All Rights Reserved.<br />
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
                      `;
  }
}
