const mongoose = require('mongoose');
const Logger = require('../logger/board');

// Source and target database configurations
const config = {
  sourceDb: 'mongodb+srv://forsico:xg2Rxlo6Ey8rTOB@forsicoboard.mongocluster.cosmos.azure.com/forsicoBoard?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000',
  targetDb: 'mongodb+srv://forsico:xg2Rxlo6Ey8rTOB@forsicoboard.mongocluster.cosmos.azure.com/userProfiles?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000',
  batchSize: 100
};

// Migration status tracking
const migrationStatus = {
  total: 0,
  migrated: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// Source User Schema (from board-api)
const SourceUserSchema = new mongoose.Schema({
  id: String,
  firstName: String,
  lastName: String,
  profilePicture: String,
  workspaces: [{ type: mongoose.Schema.Types.ObjectId }]
}, { versionKey: false, timestamps: true });

// Target User Profile Schema (to user-profile-api)
const TargetUserProfileSchema = new mongoose.Schema({
  authId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  profilePicture: {
    type: String
  },
  workspaces: [{
    workspaceId: {
      type: String,
      required: true
    },
    workspaceName: {
      type: String,
      required: true
    },
    _id: false
  }],
  subscriptions: [{
    tenantId: {
      type: String,
      required: true
    },
    planId: {
      type: String,
      required: true
    },
    subscriptionName: {
      type: String,
      required: true
    }
  }],
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: false
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  }
}, {
  timestamps: true,
  versionKey: false
});

// Transform source user to target user profile
function transformUserToUserProfile(user) {
  if (!user || !user.id) {
    throw new Error('Invalid user data: missing id');
  }

  // Ensure required fields have default values
  const firstName = user.firstName || 'Unknown';
  const lastName = user.lastName || 'User';
  const email = user.email || `${user.id}@placeholder.com`;

  return {
    authId: user.id,
    firstName: firstName,
    lastName: lastName,
    email: email,
    profilePicture: user.profilePicture || '',
    workspaces: user.workspaces ? user.workspaces.map(ws => ({
      workspaceId: ws.toString(),
      workspaceName: 'Unknown Workspace' // This will need to be updated later
    })) : [],
    subscriptions: [], // Will be populated later
    preferences: {
      language: 'en',
      notifications: {
        email: false,
        push: false
      },
      theme: 'system'
    },
    status: 'active',
    createdAt: user.createdAt || new Date(),
    updatedAt: user.updatedAt || new Date()
  };
}

// Migrate a single user
async function migrateUser(user, TargetUserProfile) {
  try {
    // Debug log to check user data structure
    Logger.info('Processing user data:', JSON.stringify(user, null, 2));

    if (!user || !user.id) {
      migrationStatus.failed++;
      migrationStatus.errors.push({
        error: 'Invalid user data: missing id',
        userData: user
      });
      Logger.error('Invalid user data:', user);
      return;
    }

    // Check if user already exists in target
    const existingUser = await TargetUserProfile.findOne({ authId: user.id });
    if (existingUser) {
      migrationStatus.skipped++;
      Logger.info(`User ${user.id} already exists in target database, skipping`);
      return;
    }

    // Transform and save user
    const userProfile = transformUserToUserProfile(user);
    await TargetUserProfile.create(userProfile);

    migrationStatus.migrated++;
    Logger.info(`Successfully migrated user ${user.id}`);
  } catch (error) {
    migrationStatus.failed++;
    migrationStatus.errors.push({
      userId: user?.id,
      error: error.message,
      userData: user
    });
    Logger.error(`Failed to migrate user ${user?.id}:`, error);
  }
}

// Main migration function
async function migrateUsers() {
  let sourceConnection, targetConnection;

  try {
    // Connect to both databases
    sourceConnection = await mongoose.createConnection(config.sourceDb);
    targetConnection = await mongoose.createConnection(config.targetDb);
    
    Logger.info('Connected to both databases');

    // Register models with their respective connections
    const SourceUser = sourceConnection.model('User', SourceUserSchema, 'users');
    const TargetUserProfile = targetConnection.model('UserProfile', TargetUserProfileSchema, 'userprofiles');

    // Get total count of users
    migrationStatus.total = await SourceUser.countDocuments();
    Logger.info(`Found ${migrationStatus.total} users to migrate`);

    // Process users in batches
    let processed = 0;
    while (processed < migrationStatus.total) {
      const users = await SourceUser
        .find()
        .skip(processed)
        .limit(config.batchSize);

      // Migrate batch of users
      await Promise.all(users.map(user => migrateUser(user, TargetUserProfile)));

      processed += users.length;
      Logger.info(`Processed ${processed}/${migrationStatus.total} users`);
    }

    // Log final status
    Logger.info('Migration completed with status:', {
      total: migrationStatus.total,
      migrated: migrationStatus.migrated,
      failed: migrationStatus.failed,
      skipped: migrationStatus.skipped
    });

    if (migrationStatus.errors.length > 0) {
      Logger.error('Migration errors:', migrationStatus.errors);
    }

  } catch (error) {
    Logger.error('Migration failed:', error);
    throw error;
  } finally {
    // Close connections
    if (sourceConnection) await sourceConnection.close();
    if (targetConnection) await targetConnection.close();
    Logger.info('Disconnected from databases');
  }
}

// Rollback function
async function rollbackMigration() {
  let targetConnection;

  try {
    // Connect to target database
    targetConnection = await mongoose.createConnection(config.targetDb);
    Logger.info('Starting rollback');

    // Register model with connection
    const TargetUserProfile = targetConnection.model('UserProfile', TargetUserProfileSchema, 'userprofiles');

    // Delete all migrated users
    const result = await TargetUserProfile.deleteMany({});
    Logger.info(`Rolled back ${result.deletedCount} users`);

  } catch (error) {
    Logger.error('Rollback failed:', error);
    throw error;
  } finally {
    if (targetConnection) await targetConnection.close();
    Logger.info('Disconnected from target database');
  }
}

// Export functions
module.exports = {
  migrateUsers,
  rollbackMigration
};

// Run migration if script is executed directly
if (require.main === module) {
  migrateUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      Logger.error('Migration failed:', error);
      process.exit(1);
    });
} 