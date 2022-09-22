import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';

const UserDir = sequelize.define(
  'Users_Dirs',
  {
    downloads: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  { paranoid: true }
);

export default UserDir;
