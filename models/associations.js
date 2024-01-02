import Transfer from './transfer.js';
import User from './user.js';
import Server from './storageServer.js';
import Disk from './disk.js';
import File from './file.js';
import Folder from './folder.js';
import UsersTransfers from './userTransfer.js';

Server.hasMany(Disk, {
  foreignKey: {
    name: 'serverId',
    allowNull: false,
  },
  onDelete: 'CASCADE',
});
Disk.belongsTo(Server, {
  foreignKey: {
    name: 'serverId',
    allowNull: false,
  },
  onDelete: 'CASCADE',
});

User.hasMany(Transfer, {
  foreignKey: {
    name: 'userId',
    allowNull: false,
  },
  onDelete: 'CASCADE',
});
Transfer.belongsTo(User, {
  foreignKey: {
    name: 'userId',
    allowNull: false,
  },
  onDelete: 'CASCADE',
});

Disk.hasMany(Transfer, {
  foreignKey: {
    name: 'diskId',
    allowNull: false,
  },
  onDelete: 'CASCADE',
});
Transfer.belongsTo(Disk, {
  foreignKey: {
    name: 'diskId',
    allowNull: false,
  },
  onDelete: 'CASCADE',
});

Transfer.hasMany(File, {
  foreignKey: 'transferId',
  onDelete: 'CASCADE',
});
File.belongsTo(Transfer, {
  foreignKey: 'transferId',
  onDelete: 'CASCADE',
});

Transfer.hasMany(Folder, {
  foreignKey: {
    name: 'transferId',
    allowNull: false,
  },
  onDelete: 'CASCADE',
});
Folder.belongsTo(Transfer, {
  foreignKey: {
    name: 'transferId',
    allowNull: false,
  },
  onDelete: 'CASCADE',
});

Folder.hasMany(File, {
  foreignKey: 'folderId',
  onDelete: 'CASCADE',
});
File.belongsTo(Folder, {
  foreignKey: 'folderId',
  onDelete: 'CASCADE',
});

User.belongsToMany(Transfer, {
  foreignKey: {
    name: 'userId',
    allowNull: false,
  },
  otherKey: {
    name: 'transferId',
    allowNull: false,
  },
  onDelete: 'CASCADE',
  through: UsersTransfers,
});
Transfer.belongsToMany(User, {
  foreignKey: {
    name: 'transferId',
    allowNull: false,
  },
  otherKey: {
    name: 'userId',
    allowNull: false,
  },
  onDelete: 'CASCADE',
  through: UsersTransfers,
});
