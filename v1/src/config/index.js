const server = require('./server');
const redisClient = require('./redisClient');

module.exports = async () => {
    try {
        await redisClient.connect();
        server();
    } catch (error) {
        console.error('Error starting the server or connecting to Redis:', error);
    }
};
