import throwErr from '../helpers/throwErr.js';
import io from '../socket.js';

export default (_, __, next) => {
  if (!io.getServerSocket()) throwErr('Internal Server Error, try again later', 500);
  next();
};
