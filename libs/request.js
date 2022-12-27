export default class Request {
  static queue = [];

  static add(obj) {
    this.queue.push(obj);
  }

  static get(requestId) {
    return this.queue.splice(
      this.queue.findIndex((entry) => entry.request === requestId),
      1
    )[0];
  }
}
