import { EMAIL_ICON_CHECK, MAX_FILES_EMAIL } from '../config/config.js';
import Email from './email.js';

class TransferDownloaded extends Email {
  constructor(download) {
    super(download.transfer.User.email, download.transfer);
    this.image = EMAIL_ICON_CHECK;
    this.subject = `${download.dstUser.email} downloaded "${this.transfer.title}".`;
    this.buildEmail(
      `<h1 style="
      margin-top: 0;
      margin-bottom: 2em;
      font-size: 20px;
      line-height: 32px;
      font-weight: normal;
      letter-spacing: -0.02em;
    ">
    This email is to inform you that ${download.dstUser.email} successfully downloaded <strong>"${this.transfer.title}"</strong></h1>`,
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
    </p>
    `
    );
  }
}

export default TransferDownloaded;
