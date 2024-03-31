import './models/associations.js';
import sequelize from './database/connection.js';
import { PORT } from './config/config.js';
import { Worker } from 'worker_threads';
import dirname from './dirname.js';
import path from 'path';
import StorageServer from './models/storageServer.js';
import Socket from './socket.js';

export default new Promise(async (res, rej) => {
  try {
    await sequelize.authenticate();
    console.log('Connection to database has been established successfully!');
    await sequelize.sync();

    await StorageServer.disconnectAll();

    const worker = new Worker(path.join(dirname, 'helpers', 'fileWatcher.js'));

    worker.on('message', (data) => {
      try {
        const { serverSocket, action, diskPath, transferId } = data;
        Socket.getServerSocket(serverSocket).emit(action, { diskPath, transferId });
      } catch (err) {
        throw err;
      }
    });

    console.log(`Server started on port ${PORT} - Running Node.js version: ${process.version}\n`);

    res();
  } catch (err) {
    rej(err);
  }
});
