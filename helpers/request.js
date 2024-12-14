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
      if (!request) throw new ErrorObject(`Could not abort. Request ${id} was not found.`);
      this.#queue.delete(id);

      const { transferId, size, server } = request;

      Socket.send(server.serverId, {
        action: 'remove-transfer',
        diskPath: server.Disks[0].path,
        transferId,
        aborted: true,
      });

      await Disk.reallocateSpace(server.Disks[0].id, size);
    } catch (err) {
      throw err;
    }
  }
}
