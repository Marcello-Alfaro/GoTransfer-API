import logger from '../helpers/logger.js';

export default (err, _, res, next) => {
  if (res.headersSent) return next(err);

  if (!err.status) {
    logger.error(err);
    return res.status(500).json({ message: 'Something went wrong, try again later!' });
  }

  res.status(err.status).json(err.message);
};
