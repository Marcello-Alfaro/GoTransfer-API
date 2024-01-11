export default (err, _, res, next) => {
  const { status = 500 } = err;
  console.error(err, new Date().toISOString());
  if (res.headersSent) return next(err);

  res.status(status).json({ message: 'Something went wrong, try again later!' });
};
