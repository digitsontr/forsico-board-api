const Logger = require("../scripts/logger/board");
const { TOPICS, ServiceBusManager } = require("../config/serviceBus");
const User = require("../models/user");

class MessageBusService {
  constructor() {
    this.isInitialized = false;
  }

  async initializeSubscriptions() {
    try {
      await ServiceBusManager.initialize();
      await this.setupAuthTopics();
      await this.setupSubscriptionTopics();
      this.isInitialized = true;
      
      Logger.log('info', 'Message Bus Service initialized successfully');
    } catch (error) {
      Logger.log('error', 'Failed to initialize message bus subscriptions', {
        error: error.message
      });
      throw error;
    }
  }

  async setupAuthTopics() {
    try {
      // User Registration Topic
      const registrationReceiver = await ServiceBusManager.createSubscriptionClient(
        TOPICS.AUTH.USER_REGISTRATION.name,
        TOPICS.AUTH.USER_REGISTRATION.subscription
      );

      registrationReceiver.subscribe({
        processMessage: async (message) => {
          try {
            const userData = typeof message.body === "string" 
              ? JSON.parse(message.body) 
              : message.body;
              
            await this.handleUserRegistration(userData);
            await registrationReceiver.completeMessage(message);
            
            Logger.log('info', 'User registration message processed successfully', {
              userId: userData.Id
            });
          } catch (error) {
            Logger.log('error', 'Error processing user registration message', {
              error: error.message,
              messageId: message.messageId
            });

            // If user already exists (duplicate key error), complete the message
            if (error.code === 11000 || error.message.includes('duplicate')) {
              await registrationReceiver.completeMessage(message);
              Logger.log('info', 'User already exists, skipping creation', {
                userId: userData.Id
              });
            } else {
              await registrationReceiver.abandonMessage(message);
            }
          }
        },
        processError: async (error) => {
          Logger.log('error', 'Error in user registration subscription', {
            error: error.message
          });
        },
      });

      // User Profile Update Topic
      const profileUpdateReceiver = await ServiceBusManager.createSubscriptionClient(
        TOPICS.AUTH.USER_PROFILE_UPDATE.name,
        TOPICS.AUTH.USER_PROFILE_UPDATE.subscription
      );

      profileUpdateReceiver.subscribe({
        processMessage: async (message) => {
          try {
            const userData = typeof message.body === "string" 
              ? JSON.parse(message.body) 
              : message.body;
              
            await this.handleUserProfileUpdate(userData);
            await profileUpdateReceiver.completeMessage(message);
            
            Logger.log('info', 'User profile update message processed successfully', {
              userId: userData.Id
            });
          } catch (error) {
            Logger.log('error', 'Error processing user profile update message', {
              error: error.message,
              messageId: message.messageId
            });
            await profileUpdateReceiver.abandonMessage(message);
          }
        },
        processError: async (error) => {
          Logger.log('error', 'Error in user profile update subscription', {
            error: error.message
          });
        },
      });

      Logger.log('info', 'Auth topics setup completed');
    } catch (error) {
      Logger.log('error', 'Error setting up auth topics', {
        error: error.message
      });
      throw error;
    }
  }

  async setupSubscriptionTopics() {
    try {
      // Subscription Created Topic
      const subscriptionCreatedReceiver = await ServiceBusManager.createSubscriptionClient(
        TOPICS.SUBSCRIPTION.SUBSCRIPTION_CREATED.name,
        TOPICS.SUBSCRIPTION.SUBSCRIPTION_CREATED.subscription
      );

      subscriptionCreatedReceiver.subscribe({
        processMessage: async (message) => {
          try {
            const subscriptionData = typeof message.body === "string" 
              ? JSON.parse(message.body) 
              : message.body;
              
            await this.handleSubscriptionCreated(subscriptionData);
            await subscriptionCreatedReceiver.completeMessage(message);
            
            Logger.log('info', 'Subscription created message processed successfully', {
              subscriptionId: subscriptionData.subscription_id
            });
          } catch (error) {
            Logger.log('error', 'Error processing subscription created message', {
              error: error.message,
              messageId: message.messageId
            });
            await subscriptionCreatedReceiver.abandonMessage(message);
          }
        },
        processError: async (error) => {
          Logger.log('error', 'Error in subscription created subscription', {
            error: error.message
          });
        },
      });

      Logger.log('info', 'Subscription topics setup completed');
    } catch (error) {
      Logger.log('error', 'Error setting up subscription topics', {
        error: error.message
      });
      throw error;
    }
  }

  async handleUserRegistration(userData) {
    try {
      const userProfile = {
        id: userData.Id,
        firstName: userData.FirstName,
        lastName: userData.LastName,
        email: userData.Email,
        profilePicture: userData.ProfilePictureUrl || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Check if user already exists
      const existingUser = await User.findOne({ id: userData.Id });
      if (existingUser) {
        Logger.log('info', 'User already exists in board-api database', {
          userId: userData.Id
        });
        return;
      }

      // Create new user
      const newUser = new User(userProfile);
      await newUser.save();

      Logger.log('info', 'Created user profile in board-api', {
        userId: userData.Id,
        email: userData.Email
      });
    } catch (error) {
      Logger.log('error', 'Error handling user registration', {
        error: error.message,
        userId: userData.Id
      });
      throw error;
    }
  }

  async handleUserProfileUpdate(userData) {
    try {
      const updateData = {
        firstName: userData.FirstName,
        lastName: userData.LastName,
        email: userData.Email,
        profilePicture: userData.ProfilePictureUrl || null,
        updatedAt: new Date()
      };

      const updatedUser = await User.findOneAndUpdate(
        { id: userData.Id },
        updateData,
        { new: true }
      );

      if (!updatedUser) {
        Logger.log('warn', 'User not found for profile update', {
          userId: userData.Id
        });
        return;
      }

      Logger.log('info', 'Updated user profile in board-api', {
        userId: userData.Id,
        email: userData.Email
      });
    } catch (error) {
      Logger.log('error', 'Error handling user profile update', {
        error: error.message,
        userId: userData.Id
      });
      throw error;
    }
  }

  async handleSubscriptionCreated(subscriptionData) {
    try {
      // Board API doesn't need to handle subscription creation directly
      // This is mainly for logging and potential future use
      Logger.log('info', 'Subscription created event received', {
        subscriptionId: subscriptionData.subscription_id,
        userId: subscriptionData.user_id
      });
    } catch (error) {
      Logger.log('error', 'Error handling subscription created', {
        error: error.message,
        subscriptionId: subscriptionData.subscription_id
      });
      throw error;
    }
  }

  async close() {
    try {
      await ServiceBusManager.close();
      this.isInitialized = false;
      Logger.log('info', 'Message Bus Service closed');
    } catch (error) {
      Logger.log('error', 'Error closing Message Bus Service', {
        error: error.message
      });
    }
  }
}

module.exports = new MessageBusService();
