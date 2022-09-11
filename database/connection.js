import { Sequelize } from 'sequelize';
import { DB_DATABASE, DB_USER, DB_PASS, DB_HOST, DB_DIALECT } from '../config/config.js';

const sequelize = new Sequelize(DB_DATABASE, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: DB_DIALECT,
});

export default sequelize;
