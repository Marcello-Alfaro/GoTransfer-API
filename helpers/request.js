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

      const { unfinished } = this.#queue[index];
      if (unfinished) return;

      const { size, server } = this.#queue.splice(index, 1)[0];

      await Disk.reallocateSpace(server.Disks[0].id, size);
    } catch (err) {
      throw err;
    }
  }

  static serverTagUnfinished(id) {
    this.#queue.forEach((request) => {
      if (request.server.serverId !== id) return;
      request.unfinished = true;
    });
  }

  static serverAbortUnfinished(id) {
    return new Promise(async (res, rej) => {
      try {
        let index;
        let removed = 0;

        while (index !== -1) {
          index = this.#queue.findIndex(
            (request) => request.server.serverId === id && request.unfinished
          );
          if (index === -1) return res(removed);

          const { transferId, server } = this.#queue.splice(index, 1)[0];

          const { ok } = await Socket.sendWithAck(server.serverId, {
            action: 'remove-transfer',
            diskPath: server.Disks[0].path,
            transferId,
          });

          if (!ok) throw new ErrorObject(`Could not remove unfinished transfer ${transferId}`);

          removed++;
        }
      } catch (err) {
        rej(err);
      }
    });
  }
}
