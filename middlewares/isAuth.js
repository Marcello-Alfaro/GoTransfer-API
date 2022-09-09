import jwt from 'jsonwebtoken';
import throwErr from '../helpers/throwErr.js';
import { jwtSecret } from '../config/config.js';
import jwtVerify from '../helpers/jwtVerify.js';

export default async (req, res, next) => {
  try {
    const { authorization = req.query.Authorization } = req.headers;
    if (!authorization) throwErr('No valid authorization header present!', 401);
    const token = authorization.split(' ')[1];
    const { name, lastname, username } = await jwtVerify(token);
    req.user = { name, lastname, username };
    next();
  } catch (err) {
    next(err);
  }
};
