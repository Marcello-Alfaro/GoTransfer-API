import { DataTypes } from 'Sequelize';
import sequelize from '../database/connection.js';

const UserFile = sequelize.define('Users_Files', {
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

export default UserFile;
