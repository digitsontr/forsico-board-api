const { connectDB } = require('./db');
// const { initializeServiceBus } = require('../services/serviceBus'); // Disabled - using new messageBusService

module.exports = async () => {
    await connectDB();
    // await initializeServiceBus(); // Disabled - using new messageBusService
}