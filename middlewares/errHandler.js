export default (err, _, res, next) => {
  const { message = 'An error has ocurred', status = 500 } = err;
  if (res.headersSent) return next(err);

  res.status(status).json({ message });
};
