import ErrorObject from '../helpers/error.js';
import StorageServer from '../models/storageServer.js';

export default (_, __, next) => {
  if (!StorageServer.getAllActive().length > 0)
    throw new ErrorObject('Internal Server Error, try again later', 500);
  next();
};
