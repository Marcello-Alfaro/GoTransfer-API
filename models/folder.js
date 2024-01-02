import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/connection.js';

class Folder extends Model {}

Folder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    folderId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
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
    files: {
      type: DataTypes.VIRTUAL,
    },
  },
  {
    sequelize,
    paranoid: true,
    hooks: {
      async afterDestroy(instance) {
        const files = await instance.getFiles();
        files.forEach(async (entry) => await entry.destroy());
      },
    },
  }
);

export default Folder;
