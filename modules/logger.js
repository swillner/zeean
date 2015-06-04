var winston = require('winston');

var logger = new winston.Logger({
  transports: [
    new winston.transports.Console({ json: false, timestamp: true, colorize: true }),
    new winston.transports.File({ filename: __dirname + '/../log/debug.log', json: true })
  ],
  exitOnError: false
});

logger.exception = function(e) {
    logger.error(e.stack);
}

process.on('uncaughtException', function (err) {
    logger.error('uncaughtException', err.stack);
});

module.exports = logger;

