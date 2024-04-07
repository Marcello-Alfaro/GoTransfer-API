import { DB_DATABASE, DB_USER, DB_PASSWORD, DB_HOST, DB_DIALECT } from '../config/config.js';
import mysql2 from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import logger from '../helpers/logger.js';

export default await (async () => {
  try {
    const connection = await mysql2.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_DATABASE}`);
    await connection.end();

    return new Sequelize(DB_DATABASE, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      dialect: DB_DIALECT,
      logging: (msg) => logger.info(msg),
    });
  } catch (err) {
    throw err;
  }
})();
