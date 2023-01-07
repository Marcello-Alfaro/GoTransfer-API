import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

const File = sequelize.define(
  'Files',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fileId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rawsize: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
  },
  { paranoid: true }
);

export default File;
