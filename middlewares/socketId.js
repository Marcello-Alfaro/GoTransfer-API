import throwErr from '../helpers/throwErr.js';

export default (req, _, next) => {
  try {
    const { socketid: socketId } = req.headers;
    if (!socketId) throwErr('No socket ID present.', 401);
    req.socketId = socketId;
    next();
  } catch (err) {
    throw err;
  }
};
