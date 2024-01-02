import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/connection.js';
import { TRANSFER_EXPIRE_TIME } from '../config/config.js';
import StorageServer from './storageServer.js';
import ErrorObject from '../helpers/error.js';
import UserTransfer from './userTransfer.js';
import Socket from '../socket.js';
import Folder from './folder.js';
import days from '../helpers/days.js';

class Transfer extends Model {
  static #transfers = [];
  static #unfinishedTransfers = [];

  add() {
    Transfer.#transfers.push(this);
    return this;
  }

  pushFile(file) {
    this.files.push(file);
    return file.fileId;
  }

  buildFolders(files = this.files.filter((file) => file.path)) {
    if (!files.length > 0) return;

    const name = files[0].path.split('/')[0];
    const folderFiles = files.filter((file) => file.path.split('/')[0] === name);
    const size = folderFiles.reduce((accum, file) => (accum += file.size), 0);

    this.folders.push(Folder.build({ name, size, files: folderFiles }));

    files = files.filter((file) => file.path.split('/')[0] !== name);

    this.buildFolders(files);
  }

  formatFiles() {
    this.buildFolders();
    this.files = this.files.filter((file) => !file.path);

    this.totalFiles = this.files.length + this.folders.length;
    return this;
  }

  static async allocate(sender, receivers, title, message, size, clientSocket) {
    try {
      const activeServers = StorageServer.getAllActive();

      if (!activeServers.length > 0)
        throw new ErrorObject('There a no servers available to process the request.');

      const chosenDisk = activeServers
        .flatMap((server) => server.Disks)
        .reduce(
          (accum, disk) => {
            if (disk.free > accum.free) accum = disk;
            return accum;
          },
          { free: 0 }
        );

      if (size > chosenDisk.free)
        throw new ErrorObject('No disk with enough space available to process the request.');

      const { id: diskId, path: diskPath } = chosenDisk;

      const { id: serverId, socketId: serverSocket } = activeServers.find((server) => {
        const disk = server.Disks.find((disk) => disk.id === diskId);
        if (!disk) return false;
        disk.free -= size;
        return true;
      });

      const { transferId } = this.build({
        title,
        message,
        size,
        clientSocket,
        serverSocket,
        serverId,
        dskId: diskId,
        diskPath,
        sender,
        receivers,
      }).add();

      const { ok } = await Socket.getServerSocket(serverSocket).emitWithAck('allocate-transfer', {
        diskPath,
        transferId,
      });

      if (!ok) throw new ErrorObject(`Could not allocate transfer in server ${serverId}`);

      return transferId;
    } catch (err) {
      throw err;
    }
  }

  reallocate() {
    try {
      const server = StorageServer.find(this.serverId);

      const disk = server.Disks.find((disk) => disk.id === this.dskId);
      if (!disk) throw new ErrorObject(`Disk with id: ${this.dskId} not found!`);
      disk.free += this.size;

      Socket.getServerSocket(server.socketId).emit('remove-transfer', {
        transferId: this.transferId,
        diskPath: this.diskPath,
      });
    } catch (err) {
      Transfer.addUnfinishedTransfer(this);
      throw err;
    }
  }

  abort() {
    try {
      this.remove().reallocate();
    } catch (err) {
      throw err;
    }
  }

  static abortAll(serverId) {
    const transfers = this.#transfers.filter((transfer) => transfer.serverId === serverId);
    this.#transfers = [...this.#transfers.filter((transfer) => transfer.serverId !== serverId)];
    this.#unfinishedTransfers.push(...transfers);
  }

  static addUnfinishedTransfer(transfer) {
    this.#unfinishedTransfers.push(transfer);
  }

  static removeUnfinishedTransfers(server) {
    const transfers = this.#unfinishedTransfers.filter(
      (transfer) => transfer.serverId === server.id
    );

    this.#unfinishedTransfers = [
      ...this.#unfinishedTransfers.filter((transfer) => transfer.serverId !== server.id),
    ];

    transfers.forEach((transfer) => transfer.reallocate());
  }

  remove() {
    try {
      const index = Transfer.#transfers.findIndex((entry) => entry.transferId === this.transferId);
      if (index === -1)
        throw new ErrorObject(`Transfer with id: ${id} was not found, could not remove.`);

      return Transfer.#transfers.splice(index, 1)[0];
    } catch (err) {
      throw err;
    }
  }

  static remove(id) {
    try {
      const index = this.#transfers.findIndex((transfer) => transfer.transferId === id);
      if (index === -1)
        throw new ErrorObject(`Transfer with id: ${id} was not found, could not remove.`);

      return this.#transfers.splice(index, 1)[0];
    } catch (err) {
      throw err;
    }
  }

  static find(id) {
    try {
      const transfer = this.#transfers.find((transfer) => transfer.transferId === id);
      if (!transfer) throw new ErrorObject(`Transfer ${id} not found!`);

      return transfer;
    } catch (err) {
      throw err;
    }
  }

  static findFile(transferId, fileId) {
    try {
      const transfer = this.#transfers.find((transfer) => transfer.transferId === transferId);
      if (!transfer) throw new ErrorObject(`Transfer with id: ${transferId} was not found.`);

      const file = transfer.files.find((file) => file.fileId === fileId);
      if (!file) throw new ErrorObject(`File with id: ${fileId} was not found!`);

      return file;
    } catch (err) {
      throw err;
    }
  }

  static findBySocket(id) {
    const transfer = this.#transfers.find((transfer) => transfer.clientSocket === id);
    if (!transfer) return;
    return transfer;
  }
}

Transfer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    transferId: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'No title',
    },
    message: {
      type: DataTypes.STRING,
    },
    totalFiles: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    size: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    expire: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date(days(TRANSFER_EXPIRE_TIME)),
    },
    warned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    clientSocket: {
      type: DataTypes.VIRTUAL,
    },
    serverSocket: {
      type: DataTypes.VIRTUAL,
    },
    serverId: {
      type: DataTypes.VIRTUAL,
    },
    dskId: {
      type: DataTypes.VIRTUAL,
    },
    diskPath: {
      type: DataTypes.VIRTUAL,
    },
    sender: {
      type: DataTypes.VIRTUAL,
    },
    receivers: {
      type: DataTypes.VIRTUAL,
    },
    files: {
      type: DataTypes.VIRTUAL,
      defaultValue: [],
    },
    folders: {
      type: DataTypes.VIRTUAL,
      defaultValue: [],
    },
  },
  {
    sequelize,
    paranoid: true,
    hooks: {
      async afterCreate(transfer, { files, folders, transferReceivers }) {
        try {
          const transferId = transfer.id;

          await Promise.all(files.map(async (file) => await file.set({ transferId }).save()));

          await Promise.all(
            folders.map(async (entry) => {
              const { id: folderId, files } = await entry.set({ transferId }).save();
              await Promise.all(files.map(async (file) => await file.set({ folderId }).save()));
            })
          );

          await Promise.all(
            transferReceivers.map(async (receiver) => {
              await transfer.addUser(receiver, { through: UserTransfer });
            })
          );
        } catch (err) {
          throw err;
        }
      },
      async afterDestroy(transfer) {
        (await transfer.getFiles()).forEach(async (file) => await file.destroy());
        (await transfer.getFolders()).forEach(async (folder) => await folder.destroy());
      },
    },
  }
);

export default Transfer;
