import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

const Attribute = sequelize.define(
  'Attributes',
  {
    userId: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { paranoid: true }
);

export default Attribute;
