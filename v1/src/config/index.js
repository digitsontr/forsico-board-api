const server = require('./server');
const getRedisClient = require('./redisClient');

module.exports = async () => {
    try {
        await getRedisClient();
        server();
    } catch (error) {
        console.error('Error starting the server or connecting to Redis:', error);
    }
};
