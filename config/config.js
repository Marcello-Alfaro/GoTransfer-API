import { v4 as uuidv4 } from 'uuid';

export const options = {
  multiples: true,
  allowEmptyFiles: false,
  maxFileSize: 9000 * 1024 * 1024,
  //`${uuidv4()}.${originalFilename.split('.').at(-1)}`
  filename: (_, __, { originalFilename }) => originalFilename,
};
export const PORT = process.env.PORT ?? 8080;
export const SALT = 12;
export const jwtSecret = 'somesupersecretsecretforyou';
export const API_URL = process.env.API_URL ?? `http://localhost:${PORT}/`;
