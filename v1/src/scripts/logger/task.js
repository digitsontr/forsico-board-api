const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "task-service" },
  transports: [
    new winston.transports.File({
      filename: "v1/src/logs/task/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "v1/src/logs/task/info.log",
      level: "info",
    }),
    new winston.transports.Console(),
  ],
});

module.exports = logger;
