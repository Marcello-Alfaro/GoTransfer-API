import sequelize from '../database/connection.js';
import { DataTypes, Model, Sequelize } from 'sequelize';

class StorageServer extends Model {
  static async add({ id: serverId, name, arch, type, memory, cpu, cores, disks }) {
    try {
      const server = await this.findOne({ where: { serverId }, include: 'Disks' });

      !server
        ? await this.create({ serverId, name, arch, type, memory, cpu, cores }, { disks })
        : await server.update({ online: true, name, arch, type, memory, cpu, cores }, { disks });
    } catch (err) {
      throw err;
    }
  }

  static async disconnect(serverId) {
    try {
      const server = await this.findOne({ where: { serverId } });

      await server.update({ online: false, lastSeen: Date.now() });

      return server;
    } catch (err) {
      throw err;
    }
  }

  static async disconnectAll() {
    try {
      const servers = await this.findAll();
      await Promise.all(servers.map(async (server) => await server.update({ online: false })));
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
    online: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    sequelize,
    paranoid: true,
    hooks: {
      async afterCreate(server, { disks }) {
        if (!disks) return;
        await Promise.all(disks.map(async (disk) => await server.createDisk(disk)));
      },
      async afterUpdate(server, { disks }) {
        if (!disks) return;
        await Promise.all(
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
