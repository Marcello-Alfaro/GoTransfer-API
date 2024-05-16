import { Model, DataTypes, Op, QueryTypes } from 'sequelize';
import sequelize from '../database/connection.js';
import StorageServer from './storageServer.js';
import ErrorObject from '../helpers/errorObject.js';
import UserTransfer from './userTransfer.js';
import Socket from '../socket.js';
import Disk from './disk.js';

class Transfer extends Model {
  static async allocate(sender, receivers, title, message, size, files, folders, clientSocket) {
    try {
      const server = await StorageServer.findAll({
        where: { online: true },
        include: {
          model: Disk,
          where: {
            free: {
              [Op.eq]: (
                await sequelize.query(
                  'SELECT MAX(d.free) AS max FROM `Disks` d INNER JOIN `StorageServers` ss ON d.`serverId` = ss.id WHERE ss.online = 1 LIMIT 100',
                  { type: QueryTypes.SELECT, plain: true }
                )
              ).max,
              [Op.gt]: size,
            },
          },
        },
        plain: true,
      });

      if (!server)
        throw new ErrorObject('There a no servers available to process this request.', 500);

      server.Disks[0].free -= size;
      await server.Disks[0].save();

      const transfer = this.build({
        title,
        message,
        size,
        requestId: null,
        clientSocket,
        server,
        dskId: server.Disks[0].id,
        sender,
        receivers,
        files,
        folders,
      });

      const { ok } = await Socket.sendWithAck(server.serverId, {
        action: 'allocate-transfer',
        diskPath: server.Disks[0].path,
        transferId: transfer.transferId,
      });

      if (!ok) throw new ErrorObject(`Could not allocate transfer in server ${server.name}`);

      return transfer;
    } catch (err) {
      throw err;
    }
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
    },
    message: {
      type: DataTypes.STRING,
    },
    size: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    expire: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    warned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    requestId: {
      type: DataTypes.VIRTUAL,
      unique: true,
      set(_) {
        this.setDataValue('requestId', this.getDataValue('transferId'));
      },
    },
    clientSocket: {
      type: DataTypes.VIRTUAL,
    },
    unfinished: {
      type: DataTypes.VIRTUAL,
      defaultValue: false,
    },
    server: {
      type: DataTypes.VIRTUAL,
    },
    nextFile: {
      type: DataTypes.VIRTUAL,
    },
    dskId: {
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
          await Promise.all(files.map(async (file) => await transfer.createFile(file)));

          await Promise.all(
            folders.map(async (entry) => {
              const folder = await transfer.createFolder(entry);
              await Promise.all(entry.files.map(async (file) => await folder.createFile(file)));
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
