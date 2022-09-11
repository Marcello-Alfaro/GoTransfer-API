export const options = {
  multiples: true,
  allowEmptyFiles: false,
  maxFileSize: 9000 * 1024 * 1024,
  filename: (_, __, { originalFilename }) => originalFilename,
};
export const SALT = 12;
export const { PORT, JWT_SECRET, DB_DATABASE, DB_USER, DB_PASS, DB_HOST, DB_DIALECT, CORS_ORIGIN } =
  process.env;
