import throwErr from '../helpers/throwErr.js';
import jwtVerify from '../helpers/jwtVerify.js';

export default async (req, _, next) => {
  try {
    const { isAuth } = req.query;
    if (isAuth === 'false') {
      req.isAuth = false;
      return next();
    }
    const { authorization } = req.headers;
    if (!authorization) throwErr('No valid authorization header present!', 401);
    const token = authorization.split(' ')[1];
    const { name, lastname, username } = await jwtVerify(token);
    req.user = { name, lastname, username };
    req.isAuth = true;
    next();
  } catch (err) {
    next(err);
  }
};
