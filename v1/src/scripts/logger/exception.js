const winston = require("winston");

const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  defaultMeta: { service: "app" },
  exceptionHandlers: [
    new winston.transports.File({
      filename: "v1/src/logs/exception/exceptions.log",
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: "v1/src/logs/exception/exceptions.log",
    }),
  ],
});

module.exports = logger;
