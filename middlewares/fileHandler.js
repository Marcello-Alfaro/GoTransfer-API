import formidable from 'formidable';
import fsp from 'fs/promises';
import { options } from '../config/config.js';
import { v4 as uuidv4 } from 'uuid';
import io from '../socket.js';
import throwErr from '../helpers/throwErr.js';

export default async (req, _, next) => {
  try {
    const { user: { username } = { username: null }, isAuth, socketId } = req;
    const dirId = uuidv4();
    const dir = !isAuth ? `storage/${dirId}` : `storage/${username}/${dirId}`;
    const form = new formidable.IncomingForm({
      ...options,
      uploadDir: await (async () => {
        try {
          await fsp.access(dir);
        } catch (err) {
          await fsp.mkdir(dir, { recursive: true });
          return dir;
        }
      })(),
    });

    form.on('fileBegin', async (_, file) => {
      if (!file.originalFilename && !file.newFilename) {
        try {
          await fsp.rm(dir, { recursive: true, force: true });
          throwErr('No valid files were provided.', 422);
        } catch (err) {
          next(err);
        }
      }
    });

    form.on('progress', (bytesReceived, bytesExpected) => {
      io.getIO()
        .to(socketId)
        .emit('progress', {
          action: 'progressUpdate',
          progress: `${Math.floor((bytesReceived / bytesExpected) * 100)}%`,
        });
    });

    form.parse(req, (err, fields, { files }) => {
      if (err) throw err;
      const filesArr = Array.isArray(files) ? files : [files];
      fields.title = !fields.title ? filesArr[0].originalFilename : fields.title;
      req.body = { ...fields, dirId, files: filesArr };
    });

    form.once('end', next);
  } catch (err) {
    next(err);
  }
};
