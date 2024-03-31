import sequelize from '../database/connection.js';
import { DataTypes, Model } from 'sequelize';
import ErrorObject from '../helpers/errorObject.js';

class Disk extends Model {
  static async reallocateSpace(id, bytes) {
    try {
      const disk = await this.findByPk(id);
      if (!disk) throw new ErrorObject(`Disk with id: ${id} not found.`);
      disk.free += bytes;
      await disk.save();
    } catch (err) {
      throw err;
    }
  }
}

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
      unique: true,
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
