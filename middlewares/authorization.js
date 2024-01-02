import ErrorObject from '../helpers/error.js';
import jwtVerify from '../helpers/jwtVerify.js';

export default async (req, _, next) => {
  try {
    const { authorization = req.params.token ?? null } = req.headers;
    if (!authorization) throw new ErrorObject('No valid authorization header present!', 401);
    req.token = await jwtVerify(authorization.split(' ')[1] ?? authorization);
    next();
  } catch (err) {
    next(err);
  }
};
