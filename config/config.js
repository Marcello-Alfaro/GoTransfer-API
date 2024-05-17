export const {
  PORT,
  WS_PORT,
  WS_IDLE_TIMEOUT,
  FILE_WATCHER_INTERVAL,
  TRANSFER_EXPIRE_TIME,
  LOGS_DESTINATION,
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
  ORIGIN_URL,
} = process.env;
export const EMAIL_LOGO =
  'https://onedrive.live.com/embed?resid=9E986EA4230FAA35%21111&authkey=%21AGCLyCya8Sdaitg&width=1110&height=152';
export const EMAIL_ICON_UPLOAD =
  'https://onedrive.live.com/embed?resid=9E986EA4230FAA35%21112&authkey=%21ALOfOLQDOUcfLIw&width=512&height=512';
export const EMAIL_ICON_DOWNLOAD =
  'https://onedrive.live.com/embed?resid=9E986EA4230FAA35%21113&authkey=%21AKhSQZgLFOcrdSc&width=512&height=512';
export const EMAIL_ICON_CHECK =
  'https://onedrive.live.com/embed?resid=9E986EA4230FAA35%21108&authkey=%21AKavbAqhfcRwFTk&width=512&height=512';
export const EMAIL_ICON_EXPIRE =
  'https://onedrive.live.com/embed?resid=9E986EA4230FAA35%21110&authkey=%21AF-IQcpeieyElUY&width=512&height=512';
export const DAY_IN_MILISECONDS = 86400000;
export const CORS_OPTIONS = {
  origin: ORIGIN_URL,
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization', 'socketId'],
};
