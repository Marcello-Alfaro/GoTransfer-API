export default (err, _, res, __) => {
  console.log(err);
  const { message = 'An error has ocurred', status = 500 } = err;
  console.error(status, message);
  res.status(status).json({ message });
};
