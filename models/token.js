import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

const Token = sequelize.define(
  'Tokens',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tokenId: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      allowNull: false,
    },
    expire: {
      type: DataTypes.DATE,
      defaultValue: new Date(Date.now() + 60 * 60 * 1000),
      allowNull: false,
    },
  },
  { paranoid: true }
);

export default Token;
