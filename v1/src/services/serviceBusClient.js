const { ServiceBusClient: AzureServiceBusClient } = require('@azure/service-bus');
const Logger = require('../scripts/logger/board');

class BoardServiceBusClient {
    constructor() {
        this.sbClient = null;
        this.isInitialized = false;
        this.connectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
        this.environment = process.env.NODE_ENV === 'development' ? '-dev' : '';
    }

    async initialize() {
        try {
            if (this.isInitialized) {
                return;
            }

            if (!this.connectionString) {
                Logger.log('warn', 'Service Bus connection string not found, Service Bus disabled');
                return;
            }

            this.sbClient = new AzureServiceBusClient(this.connectionString);
            this.isInitialized = true;
            
            Logger.log('info', 'Service Bus Client initialized', {
                environment: this.environment
            });
        } catch (error) {
            Logger.log('error', 'Error initializing Service Bus Client', {
                error: error.message
            });
            throw error;
        }
    }

    async sendMessage(topicName, messageBody) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            if (!this.sbClient) {
                Logger.log('warn', 'Service Bus not available, skipping message', {
                    topic: topicName,
                    message: messageBody
                });
                return;
            }

            const fullTopicName = `${topicName}${this.environment}`;
            const sender = this.sbClient.createSender(fullTopicName);

            const message = {
                body: messageBody,
                contentType: 'application/json'
            };

            await sender.sendMessages(message);
            await sender.close();

            Logger.log('info', 'Service Bus message sent successfully', {
                topic: fullTopicName,
                messageBody
            });

        } catch (error) {
            Logger.log('error', 'Error sending Service Bus message', {
                topic: topicName,
                error: error.message,
                messageBody
            });
            // Don't throw error to prevent breaking the main flow
        }
    }

    /**
     * Send member added to board message
     */
    async sendMemberAddedToBoard({ userId, boardId, workspaceId, subscriptionId }) {
        await this.sendMessage('member-added-to-board', {
            userId,
            boardId,
            workspaceId,
            subscriptionId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Send member removed from board message
     */
    async sendMemberRemovedFromBoard({ userId, boardId, subscriptionId }) {
        await this.sendMessage('member-removed-from-board', {
            userId,
            boardId,
            subscriptionId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Send member added to workspace message
     */
    async sendMemberAddedToWorkspace({ userId, workspaceId, subscriptionId }) {
        await this.sendMessage('member-added-to-workspace', {
            userId,
            workspaceId,
            subscriptionId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Send member removed from workspace message
     */
    async sendMemberRemovedFromWorkspace({ userId, workspaceId, subscriptionId }) {
        await this.sendMessage('member-removed-from-workspace', {
            userId,
            workspaceId,
            subscriptionId,
            timestamp: new Date().toISOString()
        });
    }

    async close() {
        try {
            if (this.sbClient) {
                await this.sbClient.close();
                this.isInitialized = false;
                Logger.log('info', 'Service Bus Client closed');
            }
        } catch (error) {
            Logger.log('error', 'Error closing Service Bus Client', {
                error: error.message
            });
        }
    }
}

module.exports = new BoardServiceBusClient();
