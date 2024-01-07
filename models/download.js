import sequelize from '../database/connection.js';
import { DataTypes, Model } from 'sequelize';
import UserTransfer from './userTransfer.js';
import TransferDownloaded from '../emails/transferDownloaded.js';
import ErrorObject from '../helpers/error.js';
import User from './user.js';

class Download extends Model {
  static #downloads = [];

  add() {
    Download.#downloads.push(this);
    return this;
  }

  static remove(id) {
    try {
      const index = this.#downloads.findIndex((download) => download.downloadId === id);
      if (index === -1)
        throw new ErrorObject(`Download with id: ${id} was not found, could not remove.`);

      return this.#downloads.splice(index, 1)[0];
    } catch (err) {
      throw err;
    }
  }
}

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
