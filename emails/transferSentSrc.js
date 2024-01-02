import { MAX_FILES_EMAIL } from '../config/config.js';
import Email from './email.js';

class TransferSentSrc extends Email {
  constructor(to, transfer) {
    super(to, transfer);
    this.subject = `"${this.transfer.title}" was sent successfully to ${
      this.transfer.receivers.length > 1
        ? `${this.transfer.receivers.at(0)} and ${this.transfer.receivers.length - 1} more`
        : this.transfer.receivers.at(0)
    }.`;
    this.buildEmail(
      `<h1 style="
      margin-top: 0;
      margin-bottom: 2em;
      font-size: 20px;
      line-height: 32px;
      font-weight: normal;
      letter-spacing: -0.02em;
    ">
                      "${this.transfer.title}" was sent successfully with the following information:
                      </h1>
                    
            <div class="info-block">
            <p
              style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 0.5em"
            >
              Receivers
            </p>
            <ol class="receivers-list">
            ${
              this.transfer.receivers.length > 3
                ? this.transfer.receivers.slice(0, 3).reduce((accum, email) => {
                    accum += `<li>${email}</li>`;
                    return accum;
                  }, '') + `<li>... and ${this.transfer.receivers.length - 3} more.</li>`
                : this.transfer.receivers.reduce((accum, email) => {
                    accum += `<li>${email}</li>`;
                    return accum;
                  }, '')
            }
            </ol>
                    </div>    
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
    </p>
    `
    );
  }
}

export default TransferSentSrc;
