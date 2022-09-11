import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config.js';
import throwErr from './throwErr.js';

export default (token) => {
  return new Promise((res, rej) => {
    try {
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) throwErr(`${err.message}, not authorized!`, 401);
        res(decoded);
      });
    } catch (err) {
      rej(err);
    }
  });
};
