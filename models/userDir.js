import { DataTypes } from 'Sequelize';
import sequelize from '../database/connection.js';

const UserDir = sequelize.define('Users_Dirs', {
  message: {
    type: DataTypes.STRING,
    defaultValue: '',
    allowNull: false,
  },
  downloads: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

export default UserDir;
