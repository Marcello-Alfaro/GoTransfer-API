export const {
  PORT = 3000,
  FILE_WATCHER_INTERVAL,
  TRANSFER_EXPIRE_TIME,
  MAX_FILE_SIZE,
  MAX_FILES_EMAIL,
  JWT_SECRET,
  SENDGRID_API_KEY,
  FROM_EMAIL,
  API_URL,
  API_PATH,
  DB_DATABASE,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_DIALECT,
  CORS_ORIGIN,
} = process.env;
export const SALT = 12;
export const DAY_IN_MILISECONDS = 86400000;
export const CORS_OPTIONS = {
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization', 'socketId'],
};
