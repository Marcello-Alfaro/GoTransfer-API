import logger from '../helpers/logger.js';

export default (err, _, res, next) => {
  const { status = 500 } = err;
  logger.error(err);
  if (res.headersSent) return next(err);

  if (status !== 500) return res.status(status).json(err);

  res.status(status).json({ message: 'Something went wrong, try again later!' });
};
