import './models/associations.js';
import sequelize from './database/connection.js';
import { NODE_ENV, PORT } from './config/config.js';
import { Worker } from 'worker_threads';
import dirname from './dirname.js';
import path from 'path';
import StorageServer from './models/storageServer.js';
import Socket from './socket.js';
import logger from './helpers/logger.js';

export default new Promise(async (res, rej) => {
  try {
    await sequelize.authenticate();
    logger.info('Connection to database has been established successfully!');
    await sequelize.sync();

    await StorageServer.disconnectAll();

    Socket.init();

    const worker = new Worker(path.join(dirname, 'helpers', 'fileWatcher.js'));

    worker.on('message', (data) => {
      try {
        const { serverId, action, diskPath, transferId } = data;

        Socket.send(serverId, { action, diskPath, transferId });
      } catch (err) {
        logger.error(err);
      }
    });

    logger.info(
      `Server started on port ${PORT} - Running Node.js ${process.version} on ${NODE_ENV} environment.`
    );

    res();
  } catch (err) {
    rej(err);
  }
});
