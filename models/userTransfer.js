import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';

const UsersTransfers = sequelize.define(
  'UsersTransfers',
  {
    downloaded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  { paranoid: true }
);

export default UsersTransfers;
