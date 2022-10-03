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
      defaultValue: uuidv4,
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
  },
  { paranoid: true }
);

export default File;
