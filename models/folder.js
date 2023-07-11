import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';

const Folder = sequelize.define(
  'Folders',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    folderId: {
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
    files: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    paranoid: true,
    hooks: {
      async afterDestroy(instance) {
        const files = await instance.getFiles();
        files.forEach(async (entry) => entry.destroy());
      },
    },
  }
);

export default Folder;
