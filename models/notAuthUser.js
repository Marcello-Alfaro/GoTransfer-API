import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';

const NotAuthUser = sequelize.define(
  'NotAuthUsers',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    srcEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dstEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { paranoid: true }
);

export default NotAuthUser;
