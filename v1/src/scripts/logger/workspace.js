const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "workspace-service" },
  transports: [
    new winston.transports.File({
      filename: "v1/src/logs/workspace/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "v1/src/logs/workspace/info.log",
      level: "info",
    }),
    new winston.transports.Console(),
  ],
});

module.exports = logger;
