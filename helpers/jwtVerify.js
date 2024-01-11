import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config.js';
import ErrorObject from './errorObject.js';

export default (token) =>
  new Promise((res, rej) => {
    try {
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) throw new ErrorObject(`${err.message}, not authorized!`, 401);
        res(decoded);
      });
    } catch (err) {
      rej(err);
    }
  });
