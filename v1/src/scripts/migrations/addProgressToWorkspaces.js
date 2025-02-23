const mongoose = require("mongoose");
const { Workspace, WorkspaceProgressState } = require("../../models/workspace");
const { connectDB } = require("../../loaders/db");
const Logger = require("../logger/workspace");

const migrateWorkspaces = async () => {
  try {
    await connectDB();
    
    // isReady property'si olan tüm workspace'leri bul
    const workspaces = await Workspace.find({});
    
    Logger.log("info", `Found ${workspaces.length} workspaces to migrate`);

    const updatePromises = workspaces.map(workspace => 
      Workspace.findByIdAndUpdate(
        workspace._id,
        {
          $set: {
            'progress.state': WorkspaceProgressState.COMPLETE,
            'progress.lastUpdated': new Date(),
            'progress.history': [{
              state: WorkspaceProgressState.COMPLETE,
              timestamp: new Date()
            }]
          },
          $unset: { isReady: 1 }
        },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    Logger.log("info", "Successfully migrated all workspaces");
    
    process.exit(0);
  } catch (error) {
    Logger.error("Error during workspace migration:", error);
    process.exit(1);
  }
};

migrateWorkspaces(); 