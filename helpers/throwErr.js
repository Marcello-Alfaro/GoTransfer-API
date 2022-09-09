export default (message, status) => {
  const err = new Error(message);
  err.status = status;
  throw err;
};
