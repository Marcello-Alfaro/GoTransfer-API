import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';

const Fileshake = sequelize.define(
  'Fileshakes',
  {
    downloaded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  { paranoid: true }
);

export default Fileshake;
