import { DataTypes } from 'Sequelize';
import sequelize from '../database/connection.js';

const receivedFile = sequelize.define('Received_Files', {
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

export default receivedFile;
