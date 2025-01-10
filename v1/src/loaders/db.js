const Mongoose = require('mongoose');
const KeyVaultClient = require('./keyvault');
const Logger = require('../scripts/logger/board');

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: 100,
      minPoolSize: 10,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      autoIndex: false, // Don't build indexes automatically in production
      maxConnecting: 10,
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeoutMS: 30000
      },
      // Connection management
      family: 4, // Use IPv4, skip trying IPv6
      maxIdleTimeMS: 30000,
      compressors: ['snappy', 'zlib']
    };

    await Mongoose.connect(await KeyVaultClient.getSecretValue('BoardApi-CONSTRING'), options);

    // Handle initial connection errors
    Mongoose.connection.on('error', (error) => {
      Logger.log('error', 'MongoDB connection error:', error);
      // Attempt reconnection
      setTimeout(() => {
        connectDB();
      }, 5000);
    });

    // Handle disconnection
    Mongoose.connection.on('disconnected', () => {
      Logger.log('warn', 'MongoDB disconnected, attempting to reconnect...');
      setTimeout(() => {
        connectDB();
      }, 5000);
    });

    // Handle successful connection
    Mongoose.connection.on('connected', () => {
      Logger.log('info', 'MongoDB connected successfully');
    });

    // Handle successful reconnection
    Mongoose.connection.on('reconnected', () => {
      Logger.log('info', 'MongoDB reconnected successfully');
    });

    Logger.log('info', 'MongoDB connection initialized');
  } catch (error) {
    Logger.log('error', 'MongoDB connection error:', error);
    // Don't exit process, attempt reconnection
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

module.exports = {
  connectDB,
};
