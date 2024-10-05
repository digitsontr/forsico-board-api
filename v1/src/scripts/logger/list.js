const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'list-service' },
    transports: [
      new winston.transports.File({ filename: 'v1/src/logs/list/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'v1/src/logs/list/info.log', level: 'info' }),
      new winston.transports.Console()
    ],
    exceptionHandlers: [
        new winston.transports.File({filename: 'v1/src/logs/list/exceptions.log'})
    ],
    rejectionHandlers: [
        new winston.transports.File({filename: 'v1/src/logs/list/exceptions.log'})
    ]
  });


  module.exports = logger;
  