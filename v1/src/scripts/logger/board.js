const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'board-service' },
    transports: [
      new winston.transports.File({ filename: 'v1/src/logs/board/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'v1/src/logs/board/info.log', level: 'info' }),
      new winston.transports.Console()
    ],
    exceptionHandlers: [
        new winston.transports.File({filename: 'v1/src/logs/board/exceptions.log'})
    ],
    rejectionHandlers: [
        new winston.transports.File({filename: 'v1/src/logs/board/exceptions.log'})
    ]
  });


  module.exports = logger;
  