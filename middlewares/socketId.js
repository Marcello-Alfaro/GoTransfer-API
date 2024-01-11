import ErrorObject from '../helpers/errorObject.js';

export default (req, _, next) => {
  try {
    const { socketid } = req.headers;
    if (!socketid) throw new ErrorObject('No socket ID present.', 401);
    req.socketId = socketid;
    next();
  } catch (err) {
    throw err;
  }
};
