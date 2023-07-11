export default class Request {
  static queue = [];

  static add(obj) {
    this.queue.push(obj);
  }

  static get(id, varname = null) {
    try {
      const index = this.queue.findIndex((entry) => entry[varname ?? 'requestId'] === id);
      if (index < 0) throw new Error(`Could not find request with id: ${id}`);

      return this.queue.splice(index, 1)[0];
    } catch (err) {
      throw err;
    }
  }
}
