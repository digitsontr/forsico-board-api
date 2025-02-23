const mongoose = require("mongoose");
const Workspace = require("../../models/workspace");
const { connectDB } = require("../../loaders/db");
const Logger = require("../logger/workspace");

const FREE_PLAN_ID = "672a6e4be2bc700de8c7d40b";

const migrateWorkspaces = async () => {
  try {
    await connectDB();
    
    // subscriptionId'si olmayan tüm workspace'leri bul
    const workspaces = await Workspace.find({ subscriptionId: { $exists: false } });
    
    Logger.log("info", `Found ${workspaces.length} workspaces to migrate`);

    // Her workspace'e free plan ID'sini ekle
    const updatePromises = workspaces.map(workspace => 
      Workspace.updateOne(
        { _id: workspace._id },
        { $set: { subscriptionId: FREE_PLAN_ID } }
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