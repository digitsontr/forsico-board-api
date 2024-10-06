const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'taskstatus-service' },
    transports: [
      new winston.transports.File({ filename: 'v1/src/logs/taskstatus/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'v1/src/logs/taskstatus/info.log', level: 'info' }),
      new winston.transports.Console()
    ],
    exceptionHandlers: [
        new winston.transports.File({filename: 'v1/src/logs/taskstatus/exceptions.log'})
    ],
    rejectionHandlers: [
        new winston.transports.File({filename: 'v1/src/logs/taskstatus/exceptions.log'})
    ]
  });


  module.exports = logger;
  