import { PORT } from './config/config.js';
import { Worker } from 'worker_threads';
import dirname from './dirname.js';
import path from 'path';
import Transfer from './models/transfer.js';

export default () => {
  try {
    console.log(`Server started on port ${PORT} - Running Node.js version: ${process.version}`);

    const worker = new Worker(path.join(dirname, 'helpers', 'fileWatcher.js'));

    worker.on('message', (data) => {
      try {
        const { action, transferId, size, serverId, dskId, diskPath } = data;

        if (action === 'remove-transfer')
          Transfer.build({ transferId, size, serverId, dskId, diskPath }).reallocate();
      } catch (err) {
        throw err;
      }
    });

    process.on('uncaughtException', (err) => console.error(err));
  } catch (err) {
    console.error(err);
  }
};
