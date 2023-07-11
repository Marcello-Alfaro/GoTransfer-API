export const {
  PORT,
  FILE_WATCHER_INTERVAL,
  JWT_SECRET,
  SENDGRID_API_KEY,
  FROM_EMAIL,
  API_URL,
  DB_DATABASE,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_DIALECT,
  CORS_ORIGIN,
} = process.env;
export const SALT = 12;
export const MAX_FILE_SIZE = 4 * 1024 ** 3;
export const CORS_OPTIONS = {
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization', 'socketId'],
};
