import sequelize from '../database/connection.js';
import { DataTypes, Model, Sequelize } from 'sequelize';
import ErrorObject from '../helpers/errorObject.js';
import Transfer from './transfer.js';
import Disk from './disk.js';

class StorageServer extends Model {
  static #servers = [];

  static getAll() {
    return this.#servers;
  }

  static getAllActive() {
    return this.#servers.filter((server) => server.online);
  }

  static async add({ serverId, name, arch, type, memory, cpu, cores, socketId, disks }) {
    try {
      const server = await (async () => {
        const [server, created] = await this.findOrCreate({
          where: { serverId },
          include: 'Disks',
          defaults: { serverId, name, arch, type, memory, cpu, cores },
        });

        if (!created)
          return await server.update(
            { name, arch, type, memory, cpu, cores, online: true },
            { disks }
          );

        server.Disks = await Promise.all(disks.map(async (disk) => await server.createDisk(disk)));

        return server;
      })();

      server.socketId = socketId;

      const serverIndex = this.#servers.findIndex((entry) => entry.serverId === serverId);

      serverIndex === -1 ? this.#servers.push(server) : (this.#servers[serverIndex] = server);

      Transfer.removeUnfinishedTransfers(server);
    } catch (err) {
      throw err;
    }
  }

  static async disconnect(socketId) {
    try {
      const serverIndex = this.#servers.findIndex((entry) => entry.socketId === socketId);

      const server = this.#servers[serverIndex];

      await server.update({ online: false, socketId: null, lastSeen: Date.now() });

      Transfer.abortAll(server.id);

      return server;
    } catch (err) {
      throw err;
    }
  }

  static find(serverId) {
    try {
      const server = this.#servers.find((server) => server.id === serverId);
      if (!server?.online)
        throw new ErrorObject(`Server with id: ${serverId} is not available of was not found!`);

      return server;
    } catch (err) {
      throw err;
    }
  }
}

StorageServer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    serverId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    arch: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    memory: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    cpu: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cores: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    online: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    socketId: {
      type: DataTypes.VIRTUAL,
    },
  },
  {
    sequelize,
    paranoid: true,
    hooks: {
      async beforeUpdate(server, { disks }) {
        if (!disks) return;
        server.Disks = await Promise.all(
          disks.map(async (disk) => {
            const serverDisk = server.Disks.find((entry) => entry.diskId === disk.diskId);
            if (serverDisk) return await serverDisk.update(disk);
            return await server.createDisk(disk);
          })
        );
      },
    },
  }
);

export default StorageServer;
