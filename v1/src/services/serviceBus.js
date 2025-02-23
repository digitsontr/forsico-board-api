const { ServiceBusClient, ReceiveMode } = require("@azure/service-bus");
const userService = require("./user");
const Logger = require("../scripts/logger/board");

const topicName = "user-registration";
const subscriptionName = "board-service";

let serviceBusClient;
let subscriptionReceiver;

const initializeServiceBus = async () => {
    try {
        const connectionString = process.env.SERVICEBUS_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('Service Bus connection string is not defined in environment variables');
        }

        serviceBusClient = new ServiceBusClient(connectionString);
        
        const options = {
            receiveMode: "peekLock", 
            maxAutoLockRenewalDurationInMs: 300000,
            maxConcurrentCalls: 1
        };

        subscriptionReceiver = serviceBusClient.createReceiver(topicName, subscriptionName);

        const messageHandler = async (messageReceived) => {
            try {
                const userProfile = messageReceived.body;
                Logger.log('info', `Processing user registration message for: ${userProfile.Id}`, userProfile);

                const userData = {
                    id: userProfile.Id,
                    firstName: userProfile.FirstName,
                    lastName: userProfile.LastName,
                    profilePicture: userProfile.ProfilePictureUrl || "",
                    workspaces: []
                };

                const result = await userService.userRegistered(userData);
                
                if (!result.status) {
                    Logger.error('User registration failed:', result.errors);
                    // Başarısız işlemde mesajı bırak (otomatik yeniden kuyruğa alınır)
                    return;
                }

                Logger.log('info', `User registration successfully completed for: ${userData.id}`, result.data);
            } catch (error) {
                Logger.error('Error processing user registration message:', error);
                // Hata durumunda mesajı bırak (otomatik yeniden kuyruğa alınır)
                throw error;
            }
        };

        const errorHandler = async (error) => {
            Logger.error('Service Bus error:', error);
            try {
                await subscriptionReceiver.close();
            } catch (closeError) {
                Logger.error('Error closing receiver:', closeError);
            }
        };

        // Mesaj almayı başlat
        subscriptionReceiver.subscribe({
            processMessage: messageHandler,
            processError: errorHandler
        });

        Logger.log('info', 'Service Bus listener initialized successfully');
    } catch (error) {
        Logger.error('Error initializing Service Bus:', error);
        throw error;
    }
};

const closeServiceBus = async () => {
    try {
        if (subscriptionReceiver) {
            await subscriptionReceiver.close();
        }
        if (serviceBusClient) {
            await serviceBusClient.close();
        }
    } catch (error) {
        Logger.error('Error closing Service Bus connection:', error);
    }
};

process.on('SIGTERM', closeServiceBus);
process.on('SIGINT', closeServiceBus);

module.exports = {
    initializeServiceBus,
    closeServiceBus
}; 