import sequelize from '../database/connection.js';
import { DataTypes, Model } from 'sequelize';

class Disk extends Model {}

Disk.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    diskId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    free: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
  },
  { sequelize, paranoid: true }
);

export default Disk;
