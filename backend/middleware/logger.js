const morgan = require('morgan');

const logger = morgan(
  process.env.NODE_ENV === 'production'
    ? 'combined'
    : ':method :url :status :res[content-length] - :response-time ms'
);

module.exports = logger;
