import './models/associations.js';
import sequelize from './database/connection.js';
import { NODE_ENV, PORT } from './config/config.js';
import { Worker } from 'worker_threads';
import dirname from './dirname.js';
import path from 'path';
import StorageServer from './models/storageServer.js';
import os from 'os';
import logger from './helpers/logger.js';

export default (app) =>
  new Promise(async (res) => {
    try {
      await sequelize.authenticate();
      logger.info('Connection to database has been established successfully!');
      await sequelize.sync();

      await StorageServer.disconnectAll();

      const worker = new Worker(path.join(dirname, 'helpers', 'fileWatcher.js'));

      worker.on('message', (data) => {
        try {
          const { serverId, action, diskPath, transferId } = data;

          Socket.send(serverId, { action, diskPath, transferId });
        } catch (err) {
          logger.error(err);
        }
      });

      res(
        app.listen(PORT, () => {
          console.log('------------------------------------------------------------------');
          console.log(`GoTransfer-API started on server ${os.hostname()} | Port: ${PORT}`);
          console.log(`Running Node.js ${process.version} on ${NODE_ENV} environment.`);
          console.log(`Platform: ${os.platform()} ${os.arch()}`);
          console.log(`Memory: ${os.totalmem()}`);
          console.log(`CPU: ${os.cpus()[0].model.trim()}`);
          console.log('------------------------------------------------------------------');
        })
      );
    } catch (err) {
      process.exit(1);
    }
  });
