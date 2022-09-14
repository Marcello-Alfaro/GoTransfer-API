import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';

const Dir = sequelize.define('Dirs', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  dirId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    defaultValue: 'No message provided.',
    allowNull: false,
  },
  expire: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  warned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
});

export default Dir;
