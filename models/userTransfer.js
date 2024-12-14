import { Model } from 'sequelize';
import sequelize from '../database/connection.js';

class UserTransfer extends Model {}

UserTransfer.init({}, { sequelize, tableName: 'UsersTransfers', paranoid: true });

export default UserTransfer;
