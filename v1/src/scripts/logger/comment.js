const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'comment-service' },
    transports: [
      new winston.transports.File({ filename: 'v1/src/logs/comment/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'v1/src/logs/comment/info.log', level: 'info' }),
      new winston.transports.Console()
    ],
    exceptionHandlers: [
        new winston.transports.File({filename: 'v1/src/logs/comment/exceptions.log'})
    ],
    rejectionHandlers: [
        new winston.transports.File({filename: 'v1/src/logs/comment/exceptions.log'})
    ]
  });


  module.exports = logger;
  