import throwErr from '../helpers/throwErr.js';

export default (req, _, next) => {
  try {
    const { socketid } = req.headers;
    if (!socketid) throwErr('No socket ID present.', 401);
    req.socketId = socketid;
    next();
  } catch (err) {
    throw err;
  }
};
