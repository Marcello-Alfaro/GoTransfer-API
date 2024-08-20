import Disk from '../models/disk.js';
import Socket from '../socket.js';
import ErrorObject from './errorObject.js';

export default class Request {
  static #queue = new Map();

  static add(request) {
    this.#queue.set(request.requestId, request);
    return request.requestId;
  }

  static find(id) {
    try {
      const request = this.#queue.get(id);
      if (!request) throw new ErrorObject(`Request ${id} not found!`);

      return request;
    } catch (err) {
      throw err;
    }
  }

  static remove(id) {
    try {
      const request = this.#queue.get(id);
      if (!request)
        throw new ErrorObject(`Request with id: ${id} was not found, could not remove.`);

      this.#queue.delete(id);

      return request;
    } catch (err) {
      throw err;
    }
  }

  static async clientAbort(id) {
    try {
      const request = this.#queue.get(id);
      if (!request) return;

      const { unfinished } = request;
      if (unfinished) return;

      const { size, server } = request;

      this.#queue.delete(id);

      await Disk.reallocateSpace(server.Disks[0].id, size);
    } catch (err) {
      throw err;
    }
  }

  static serverTagUnfinished(serverId) {
    for (const [_, request] of this.#queue) {
      if (request.server.serverId !== serverId) return;
      request.unfinished = true;
    }
  }

  static serverAbortUnfinished(serverId) {
    return new Promise(async (res, rej) => {
      try {
        let removed = 0;

        for (const [key, request] of this.#queue) {
          if (request.server.serverId === serverId && request.unfinished) {
            const { transferId, server } = request;

            const { ok } = await Socket.sendWithAck(server.serverId, {
              action: 'remove-transfer',
              diskPath: server.Disks[0].path,
              transferId,
            });

            if (!ok) throw new ErrorObject(`Could not remove unfinished transfer ${transferId}`);

            this.#queue.delete(key);
            removed++;
          }
        }

        res(removed);
      } catch (err) {
        rej(err);
      }
    });
  }
}
