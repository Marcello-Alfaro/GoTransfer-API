import Disk from '../models/disk.js';
import Socket from '../socket.js';
import ErrorObject from './errorObject.js';

export default class Request {
  static #queue = [];

  static add(request) {
    this.#queue.push(request);
    return request;
  }

  static find(id) {
    try {
      const request = this.#queue.find(({ requestId }) => requestId === id);
      if (!request) throw new ErrorObject(`Request ${id} not found!`);

      return request;
    } catch (err) {
      throw err;
    }
  }

  static remove(id) {
    try {
      const index = this.#queue.findIndex(({ requestId }) => requestId === id);
      if (index === -1)
        throw new ErrorObject(`Request with id: ${id} was not found, could not remove.`);

      return this.#queue.splice(index, 1)[0];
    } catch (err) {
      throw err;
    }
  }

  static async clientAbort(socketId) {
    try {
      const index = this.#queue.findIndex(({ clientSocket }) => clientSocket === socketId);
      if (index === -1) return;

      const {
        transferId,
        size,
        server: { socketId: serverSocket, Disks },
      } = this.#queue.splice(index, 1)[0];

      Socket.getServerSocket(serverSocket).emit('remove-transfer', {
        diskPath: Disks[0].path,
        transferId,
      });

      await Disk.reallocateSpace(Disks[0].id, size);
    } catch (err) {
      throw err;
    }
  }

  static serverTagUnfinished(socketId) {
    this.#queue.forEach((request) => {
      if (request.server.socketId !== socketId) return;
      request.unfinished = true;
    });
  }

  static serverAbortUnfinished(id, serverSocket) {
    return new Promise(async (res, rej) => {
      try {
        let index;

        while (index !== -1) {
          index = this.#queue.findIndex(
            (request) => request.server.serverId === id && request.unfinished
          );
          if (index === -1) return res();

          const {
            transferId,
            server: { Disks },
          } = this.#queue.splice(index, 1)[0];

          const { ok } = await Socket.getServerSocket(serverSocket).emitWithAck('remove-transfer', {
            diskPath: Disks[0].path,
            transferId,
          });

          if (!ok) throw new ErrorObject(`Could not remove unfinished transfer ${transferId}`);
        }
      } catch (err) {
        rej(err);
      }
    });
  }
}
