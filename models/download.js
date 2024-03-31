import sequelize from '../database/connection.js';
import { Model, DataTypes } from 'sequelize';
import UserTransfer from './userTransfer.js';
import TransferDownloaded from '../emails/transferDownloaded.js';

class Download extends Model {}

Download.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    downloadId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false,
    },
    downloadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: UserTransfer,
        key: 'userId',
      },
    },
    transferId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: UserTransfer,
        key: 'transferId',
      },
    },
    requestId: {
      type: DataTypes.VIRTUAL,
      unique: true,
      set(_) {
        this.setDataValue('requestId', this.getDataValue('downloadId'));
      },
    },
    mainHttpResponse: {
      type: DataTypes.VIRTUAL,
    },
    dstUser: {
      type: DataTypes.VIRTUAL,
    },
    transfer: {
      type: DataTypes.VIRTUAL,
    },
  },
  {
    sequelize,
    paranoid: true,
    hooks: {
      async afterCreate(download) {
        await new TransferDownloaded(download).send();
      },
    },
  }
);

export default Download;
