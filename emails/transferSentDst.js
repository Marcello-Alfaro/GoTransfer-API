import {
  API_URL,
  API_PATH,
  TRANSFER_EXPIRE_TIME,
  JWT_SECRET,
  MAX_FILES_EMAIL,
} from '../config/config.js';
import Email from './email.js';
import jwt from 'jsonwebtoken';

class TransferSentDst extends Email {
  constructor(to, transfer) {
    super(to, transfer);
    this.image = 'download.png';
    this.subject = `${this.transfer.sender} sent you "${this.transfer.title}"`;
    this.buildEmail(
      `<h1 style="
          margin-top: 0;
          margin-bottom: 2em;
          font-size: 20px;
          line-height: 32px;
          font-weight: normal;
          letter-spacing: -0.02em;
        ">
        ${this.transfer.sender} sent you <strong>"${this.transfer.title}"</strong> with the following files:
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

export default TransferSentDst;
