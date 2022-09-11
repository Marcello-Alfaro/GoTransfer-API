export const options = {
  multiples: true,
  allowEmptyFiles: false,
  maxFileSize: 9000 * 1024 * 1024,
  //`${uuidv4()}.${originalFilename.split('.').at(-1)}`
  filename: (_, __, { originalFilename }) => originalFilename,
};
export const SALT = 12;
export const { PORT = 8080, JWT_SECRET, DB_CONNECTION } = process.env;
