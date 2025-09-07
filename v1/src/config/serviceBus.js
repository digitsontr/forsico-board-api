const { ServiceBusClient: AzureServiceBusClient } = require("@azure/service-bus");
const Logger = require("../scripts/logger/board");

const TOPICS = {
  AUTH: {
    USER_REGISTRATION: {
      name: process.env.NODE_ENV === "production" 
        ? "user-registration" 
        : "user-registration-dev",
      subscription: "board-api",
    },
    USER_PROFILE_UPDATE: {
      name: process.env.NODE_ENV === "production" 
        ? "user-profile-update" 
        : "user-profile-update-dev",
      subscription: "board-api",
    },
  },
  SUBSCRIPTION: {
    SUBSCRIPTION_CREATED: {
      name: process.env.NODE_ENV === "production" 
        ? "subscription-created" 
        : "subscription-created-dev",
      subscription: "board-api",
    },
    SUBSCRIPTION_USER_ADDED: {
      name: process.env.NODE_ENV === "production" 
        ? "subscription-user-added" 
        : "subscription-user-added-dev",
      subscription: "board-api",
    },
    SUBSCRIPTION_USER_REMOVED: {
      name: process.env.NODE_ENV === "production" 
        ? "subscription-user-removed" 
        : "subscription-user-removed-dev",
      subscription: "board-api",
    },
  },
};

class ServiceBusManager {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.connectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
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

      this.client = new AzureServiceBusClient(this.connectionString);
      this.isInitialized = true;
      
      Logger.log('info', 'Service Bus Manager initialized', {
        environment: process.env.NODE_ENV
      });
    } catch (error) {
      Logger.log('error', 'Error initializing Service Bus Manager', {
        error: error.message
      });
      throw error;
    }
  }

  async createSubscriptionClient(topicName, subscriptionName) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.client) {
        throw new Error('Service Bus client not initialized');
      }

      const receiver = this.client.createReceiver(topicName, subscriptionName);
      
      Logger.log('debug', 'Created subscription client', {
        topic: topicName,
        subscription: subscriptionName
      });

      return receiver;
    } catch (error) {
      Logger.log('error', 'Error creating subscription client', {
        topic: topicName,
        subscription: subscriptionName,
        error: error.message
      });
      throw error;
    }
  }

  async createSender(topicName) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.client) {
        throw new Error('Service Bus client not initialized');
      }

      const sender = this.client.createSender(topicName);
      
      Logger.log('debug', 'Created sender client', {
        topic: topicName
      });

      return sender;
    } catch (error) {
      Logger.log('error', 'Error creating sender client', {
        topic: topicName,
        error: error.message
      });
      throw error;
    }
  }

  async close() {
    try {
      if (this.client) {
        await this.client.close();
        this.isInitialized = false;
        Logger.log('info', 'Service Bus Manager closed');
      }
    } catch (error) {
      Logger.log('error', 'Error closing Service Bus Manager', {
        error: error.message
      });
    }
  }
}

const serviceBusManager = new ServiceBusManager();

module.exports = {
  TOPICS,
  ServiceBusManager: serviceBusManager
};
