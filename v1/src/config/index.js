const server = require('./server');
const redisClient = require('./redisClient');

module.exports = async () => {
    try {
        console.log('REDIS STARTED');
        await redisClient.connect();
        console.info('Redis is connected.');
        server();
    } catch (error) {
        console.error('Error starting the server or connecting to Redis:', error);
    }
};
