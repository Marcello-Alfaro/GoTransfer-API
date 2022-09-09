export default (fileSize) => {
  if (`${fileSize}`.length > 9) return `${(fileSize / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (`${fileSize}`.length > 6) return `${Math.round(fileSize / (1024 * 1024))} MB`;
  return `${Math.round(fileSize / 1024)} KB`;
};
