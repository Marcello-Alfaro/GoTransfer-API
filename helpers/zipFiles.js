import fs from 'fs';
import fsp from 'fs/promises';
import JSZip from 'jszip';

export default (files, username, dir, title) => {
  return new Promise((res, rej) => {
    try {
      const zip = new JSZip();
      const filepath = `data/${username}/${dir}/${title}.zip`;
      files.forEach(async (entry) => {
        try {
          const file = `data/${username}/${dir}/${entry.name}`;
          await zip.file(entry.name, fsp.readFile(file));
          process.on('uncaughtException', rej);
        } catch (err) {
          rej(err);
        }
      });
      zip
        .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
        .pipe(fs.createWriteStream(filepath))
        .on('finish', () => res(filepath));
    } catch (err) {
      rej(err);
    }
  });
};
