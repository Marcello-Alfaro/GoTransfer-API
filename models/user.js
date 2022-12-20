import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';

const User = sequelize.define(
  'Users',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  },
  { paranoid: true }
);

export default User;
