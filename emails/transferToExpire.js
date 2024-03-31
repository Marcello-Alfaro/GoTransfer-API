import {
  API_URL,
  API_PATH,
  TRANSFER_EXPIRE_TIME,
  JWT_SECRET,
  MAX_FILES_EMAIL,
  EMAIL_ICON_EXPIRE,
} from '../config/config.js';
import Email from './email.js';
import jwt from 'jsonwebtoken';

export default class TransferToExpired extends Email {
  constructor(to, transfer) {
    super(to, transfer);
    this.image = EMAIL_ICON_EXPIRE;
    this.subject = `"${transfer.title}" will expire in 1 day!`;
    this.buildEmail(
      `<h1 style="
      margin-top: 0;
      margin-bottom: 2em;
      font-size: 20px;
      line-height: 32px;
      font-weight: normal;
      letter-spacing: -0.02em;
    "
                      >
                      This email is to nofify you that <span style="font-weight: 600">"${this.transfer.title}"</span> sent by ${transfer.User.email} is about to expire!
                      </h1>
                      
`,
      `<ol>
    ${this.files.slice(0, MAX_FILES_EMAIL).reduce((accum, file) => {
      accum += `<li><strong>${file.name}</strong>
      <p class="size">Size: ${this.formatFileSize(file.size)}</p>
      </li>`;
      return accum;
    }, '')}
    </ol>
    ${
      this.files.length > MAX_FILES_EMAIL
        ? `<p style="font-size: 18px; margin-left: 3.6em; margin-bottom: 1.6em">... and ${
            this.files.length - MAX_FILES_EMAIL
          } more.</p>`
        : ''
    }
    <p style="margin-top: 0; margin-bottom: 18px"></p>
    
    <a style="background: #228be6;
                      text-decoration: none;
                      padding: 10px 25px;
                      color: #fff;
                      border-radius: 4px;
                      display: inline-block;
                      mso-padding-alt: 0;
                      text-underline-color: #228be6;" 
        href="${
          this.files.length > 1
            ? `${API_URL + API_PATH}/download/${jwt.sign(
                { tid: this.transfer.transferId, dstid: this.to.userId },
                JWT_SECRET,
                {
                  expiresIn: `${TRANSFER_EXPIRE_TIME}d`,
                }
              )}`
            : `${API_URL + API_PATH}/download/${jwt.sign(
                {
                  tid: this.transfer.transferId,
                  dtyp: this.files.at(0)?.fileId ? 'b5ac9c2b' : '08ad027d',
                  ffid: this.files.at(0)?.fileId ?? this.files.at(0).folderId,
                  dstid: this.to.userId,
                },
                JWT_SECRET,
                { expiresIn: `${TRANSFER_EXPIRE_TIME}d` }
              )}`
        }" download><span style="mso-text-raise: 10pt; font-weight: bold"
        >Download Now</span
      ></a>
    `
    );
  }
}
