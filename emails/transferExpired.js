import { MAX_FILES_EMAIL } from '../config/config.js';
import Email from './email.js';

export default class TransferExpired extends Email {
  expired = true;

  constructor(to, transfer) {
    super(to, transfer);
    this.image = 'expire.png';
    this.subject = `"${transfer.title}" expired!`;
    this.buildEmail(
      `<h1 style="
    margin-top: 0;
    margin-bottom: 2em;
    font-size: 20px;
    line-height: 32px;
    font-weight: normal;
    letter-spacing: -0.02em;
  ">
    This email is to nofify you that <span style="font-weight: 600">"${this.transfer.title}"</span> sent by ${transfer.User.email} expired!
    </h1>`,
      `<ol>
    ${this.files.slice(0, MAX_FILES_EMAIL).reduce((accum, file) => {
      accum += `<li><strong>${file.name}</strong> - <span class="downloadedAt">Expired</span>
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
</ol>
`
    );
  }
}
