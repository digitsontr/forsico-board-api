const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'checklist-service' },
    transports: [
      new winston.transports.File({ filename: 'v1/src/logs/checklist/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'v1/src/logs/checklist/info.log', level: 'info' }),
      new winston.transports.Console()
    ],
    exceptionHandlers: [
        new winston.transports.File({filename: 'v1/src/logs/checklist/exceptions.log'})
    ],
    rejectionHandlers: [
        new winston.transports.File({filename: 'v1/src/logs/checklist/exceptions.log'})
    ]
  });


  module.exports = logger;
  