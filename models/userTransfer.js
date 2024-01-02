import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/connection.js';

class UserTransfer extends Model {}

UserTransfer.init(
  {
    downloaded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  { sequelize, tableName: 'UsersTransfers', paranoid: true }
);

export default UserTransfer;
