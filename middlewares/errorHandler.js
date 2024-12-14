import logger from '../helpers/logger.js';

export default (err, _, res, next) => {
  logger.error(err);

  if (res.headersSent) return next(err);

  if (!err.status) {
    return res.status(500).json({ message: 'Something went wrong, try again later!' });
  }

  res.status(err.status).json({ message: err.message });
};
