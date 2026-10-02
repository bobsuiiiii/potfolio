const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

module.exports = async function connectDb() {
  mongoose.connection.on('error', (e) => logger.error({ event: 'mongo_error', msg: e.message }));
  mongoose.connection.on('disconnected', () => logger.warn({ event: 'mongo_disconnected' }));
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  logger.info({ event: 'mongo_connected' });
};
