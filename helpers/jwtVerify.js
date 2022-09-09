import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/config.js';
import throwErr from './throwErr.js';

export default (token) => {
  return new Promise((res, rej) => {
    try {
      jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) throwErr(`${err.message}, not authorized!`, 401);
        res(decoded);
      });
    } catch (err) {
      rej(err);
    }
  });
};
