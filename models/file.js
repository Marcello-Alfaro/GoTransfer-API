import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/connection.js';
import Socket from '../socket.js';
import { pipeline } from 'stream';

class File extends Model {
  triggerStream(res) {
    pipeline(this.file, res, (err) => err && console.error(err));
    this.file.on('data', (chunk) =>
      Socket.getClientSocket(this.clientSocket).emit('bytes-received', chunk.length)
    );
  }
}

File.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fileId: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING,
    },
    file: {
      type: DataTypes.VIRTUAL,
    },
    clientSocket: {
      type: DataTypes.VIRTUAL,
    },
  },
  { sequelize, paranoid: true }
);

export default File;
