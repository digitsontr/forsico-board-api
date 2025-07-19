const { connectDB } = require('./db');
const { initializeServiceBus } = require('../services/serviceBus');

module.exports = async () => {
    await connectDB();
    await initializeServiceBus();
}