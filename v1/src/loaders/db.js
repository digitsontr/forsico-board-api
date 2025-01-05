const Mongoose = require('mongoose');
const KeyVaultClient = require('./keyvault');
const Logger = require('../scripts/logger/board');

const createIndexes = async () => {
  try {
    // Workspace indexes
    await Mongoose.model('Workspace').collection.createIndexes([
      { key: { members: 1, isDeleted: 1 } },
      { key: { 'members': 1, 'isDeleted': 1, 'createdAt': -1 } },
    ]);

    // Board indexes
    await Mongoose.model('Board').collection.createIndexes([
      { key: { workspaceId: 1, isDeleted: 1 } },
      { key: { members: 1, isDeleted: 1 } },
      { key: { 'workspaceId': 1, 'isDeleted': 1, 'createdAt': -1 } },
    ]);

    // Task indexes
    await Mongoose.model('Task').collection.createIndexes([
      { key: { workspaceId: 1, boardId: 1, isDeleted: 1 } },
      { key: { listId: 1, isDeleted: 1 } },
      { key: { assignee: 1, isDeleted: 1 } },
      { key: { statusId: 1 } },
      { key: { parentTask: 1 } },
    ]);

    // List indexes
    await Mongoose.model('List').collection.createIndexes([
      { key: { boardId: 1, isDeleted: 1 } },
      { key: { workspaceId: 1, isDeleted: 1 } },
    ]);

    Logger.log('info', 'Database indexes created successfully');
  } catch (error) {
    Logger.log('error', 'Error creating database indexes:', error);
    throw error;
  }
};

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: 100, // Increase pool size for multi-tenant
      minPoolSize: 10,  // Minimum connections
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    };

    await Mongoose.connect(await KeyVaultClient.getSecretValue('BoardApi-CONSTRING'), options);
    
    // Create indexes after successful connection
    await createIndexes();
    
    Logger.log('info', 'MongoDB connected successfully');
  } catch (error) {
    Logger.log('error', 'MongoDB connection error:', error);
    process.exit(1);
  }
};

// Handle connection errors
Mongoose.connection.on('error', (error) => {
  Logger.log('error', 'MongoDB connection error:', error);
});

// Handle connection success
Mongoose.connection.on('connected', () => {
  Logger.log('info', 'MongoDB connected');
});

// Handle disconnection
Mongoose.connection.on('disconnected', () => {
  Logger.log('warn', 'MongoDB disconnected');
});

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await Mongoose.connection.close();
    Logger.log('info', 'MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    Logger.log('error', 'Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

module.exports = {
  connectDB,
};
