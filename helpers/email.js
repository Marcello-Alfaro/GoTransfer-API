import { FROM_EMAIL, API_URL } from '../config/config.js';

const styles = `<style>
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
</style>`;

export default {
  srcFileSent(sender, receiver, dir) {
    const shortVer = receiver.split('@')[0];
    return {
      to: sender,
      from: FROM_EMAIL,
      subject: `"${dir.title}" was sent to ${shortVer}`,
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
          ${styles}
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
                        Hi there, "${dir.title}" was sent successfully to ${shortVer} with ${
        dir.Files.length > 1 ? `${dir.Files.length} files` : `1 file`
      }:
                        </h1>
                        <p>Total size: ${dir.size}</p>
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
  },
  srcFileSentMultiple(sender, numReceivers, dir) {
    return {
      to: sender,
      from: FROM_EMAIL,
      subject: `"${dir.title}" was successfully sent to ${numReceivers} receivers`,
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
          ${styles}
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
                        Hi there, "${
                          dir.title
                        }" was sent successfully to ${numReceivers} receivers with ${
        dir.Files.length > 1 ? `${dir.Files.length} files` : `1 file`
      }:
                        </h1>
                        <p>Total size: ${dir.size}</p>
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
  },
  dstFileSent(sender, receiver, dir) {
    const shortVer = sender.split('@')[0];
    return {
      to: receiver,
      from: FROM_EMAIL,
      subject: `${shortVer} sent you "${dir.title}" with ${
        dir.Files.length > 1 ? `${dir.Files.length} files` : `1 file`
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
          ${styles}
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
                        Hi there, ${shortVer} sent you "${dir.title}" with ${
        dir.Files.length > 1 ? `${dir.Files.length} files` : '1 file'
      }.
                        </h1>
                        <p>Total size: ${dir.size}</p>
                        ${!dir.message ? '' : `<p>${dir.message}</p>`}
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
                          ${dir.Files.reduce((accum, entry) => {
                            accum += `<li><a href="${API_URL}/files/download/${dir.dirId}/${entry.fileId}?sender=${sender}&receiver=${receiver}" download>${entry.name}</a>
                            <p class="size">size: ${entry.size}</p>
                            </li>`;
                            return accum;
                          }, '')}
                          </ol>
                          <p style="margin-top: 0; margin-bottom: 18px"></p>
                          <p style="margin: 0">
                          ${
                            dir.Files.length > 1 && dir.Files.find((file) => file.rawsize > 2 ** 32)
                              ? ''
                              : dir.Files.length > 1
                              ? `<a style="background: #228be6;
                                          text-decoration: none;
                                          padding: 10px 25px;
                                          color: #fff;
                                          border-radius: 4px;
                                          display: inline-block;
                                          mso-padding-alt: 0;
                                          text-underline-color: #228be6;" 
                            href="${API_URL}/files/download/${dir.dirId}?sender=${sender}&receiver=${receiver}" download><span style="mso-text-raise: 10pt; font-weight: bold"
                            >Download All</span
                          ></a
                        >`
                              : `<a style="background: #228be6;
                                          text-decoration: none;
                                          padding: 10px 25px;
                                          color: #fff;
                                          border-radius: 4px;
                                          display: inline-block;
                                          mso-padding-alt: 0;
                                          text-underline-color: #228be6;" 
                              href="${API_URL}/files/download/${dir.dirId}/${dir.Files[0].fileId}?sender=${sender}&receiver=${receiver}" download><span style="mso-text-raise: 10pt; font-weight: bold"
                              >Download File</span
                            ></a
                          >`
                          }
                          </p>
                        </div>
                        
                      </td>
                    </tr>
                    <tr>
                    <td style="padding: 30px; background-color: #ffffff">
                      <p style="margin: 0; font-style: italic;">
                        Note: All uploads will have an expiration time of 5 days. Once the time expires, the file(s) will be automatically removed. 
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
  },
  srcPartialDownload(sender, receiver, dir, file) {
    const shortVer = receiver.split('@')[0];
    return {
      to: sender,
      from: FROM_EMAIL,
      subject: `${shortVer} partially downloaded "${dir.title}"`,
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
          ${styles}
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
                        Hello, this email is to notify you that ${shortVer} downloaded one of the files in "${
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
  },
  srcDownloadAll(sender, receiver, dir) {
    const shortVer = receiver.split('@')[0];
    return {
      to: sender,
      from: FROM_EMAIL,
      subject: `${shortVer} downloaded "${dir.title}" and all its files`,
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
                ${styles}
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
                              Hey there, this email is to notify you that ${shortVer} successfully downloaded "${
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
  },
  dstFilesAbout2Expire(sender, receiver, dir) {
    const shortVer = sender.split('@')[0];
    return {
      to: receiver,
      from: FROM_EMAIL,
      subject: `"${dir.title}" sent by ${shortVer} is about to expire!`,
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
        ${styles}
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
                      Hello, this is email is to nofify you that "${
                        dir.title
                      }" with the following file(s) will expire in 1 day:
                      </h1>
                      </p
                      ${!dir.message ? '' : `<p> Message: ${dir.message}</p>`}
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
                      src="${API_URL}/images/expire.png"
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
                          <ol>
                          ${dir.Files.reduce((accum, entry) => {
                            accum += `<li><a href="${API_URL}/files/download/${dir.dirId}/${entry.fileId}?sender=${sender}&receiver=${receiver}" download>${entry.name}</a>
                            <p class="size">size: ${entry.size}</p>
                            </li>`;
                            return accum;
                          }, '')}
                          </ol>
                          <p style="margin-top: 0; margin-bottom: 18px"></p>
                          <p style="margin: 0">
                          ${
                            dir.Files.length > 1
                              ? `<a class="btn-download-all" href="${API_URL}/files/download/${dir.dirId}?sender=${sender}&receiver=${receiver}" download><span style="mso-text-raise: 10pt; font-weight: bold"
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
                      Note: All uploads will have an expiration time of 5 days. Once the time expires, the file(s) will be automatically removed. 
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
  },
  srcFileExpired(sender, receiver, dir) {
    return {
      to: sender,
      from: FROM_EMAIL,
      subject: `Your file "${dir.title}" expired!`,
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
        ${styles}
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
                      Hello, this is email is to nofify you that "${
                        dir.title
                      }" with the following files has expired:
                      </h1>
                      <p>Total size: ${dir.size}</p>
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
                      src="${API_URL}/images/expire.png"
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
                        <ol>
                        ${dir.Files.reduce(
                          (accum, entry) =>
                            (accum += `${
                              !entry.deletedAt
                                ? `<li><strong>${entry.name}</strong> - <span class="downloadedAt">Expired</span>`
                                : `<li><strong class="downloaded">${
                                    entry.name
                                  }</strong> - <span class="downloadedAt">${
                                    entry.deletedAt.toISOString().split('T')[0]
                                  }</span>`
                            }
                          <p class="size">size: ${entry.size}</p>
                          </li>`),

                          ''
                        )}
                        </ol>
                        <p style="margin-top: 0; margin-bottom: 18px"></p>
                        <p style="margin: 0"></p>
                      </div>
                      
                    </td>
                  </tr>
                  <tr>
                  <td style="padding: 30px; background-color: #ffffff">
                    <p style="margin: 0; font-style: italic;">
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
  },

  dstFileExpired(sender, receiver, dir) {
    const shortVer = sender.split('@')[0];
    return {
      to: receiver,
      from: FROM_EMAIL,
      subject: `File "${dir.title}" expired!`,
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
        ${styles}
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
                      Hello, this is email is to nofify you that the following files sent
                      by ${shortVer} has expired:
                      </h1>
                      <p>Total size: ${dir.size}</p>
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
                      src="${API_URL}/images/expire.png"
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
                        <ol>
                        ${dir.Files.reduce(
                          (accum, entry) =>
                            (accum += `${
                              !entry.deletedAt
                                ? `<li><strong>${entry.name}</strong> - <span class="downloadedAt">Expired</span>`
                                : `<li><strong class="downloaded">${
                                    entry.name
                                  }</strong> - <span class="downloadedAt">${
                                    entry.deletedAt.toISOString().split('T')[0]
                                  }</span>`
                            }
                          <p class="size">size: ${entry.size}</p>
                          </li>`),

                          ''
                        )}
                        </ol>
                        <p style="margin-top: 0; margin-bottom: 18px"></p>
                        <p style="margin: 0"></p>
                      </div>
                      
                    </td>
                  </tr>
                  <tr>
                  <td style="padding: 30px; background-color: #ffffff">
                    <p style="margin: 0; font-style: italic;">
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
  },
};
