export default class ErrorObject extends Error {
  constructor(message, statusCode, errors = []) {
    super();

    this.message = message;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}
