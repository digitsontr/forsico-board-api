const cron = require("node-cron");
const { hardDelete } = require("../../services/hardDelete");

cron.schedule("0 2 * * *", async () => {
  console.log("Running hard delete process...");

  try {
    await hardDelete();

    console.log("Hard delete process completed.");
  } catch (error) {
    console.error("Error during hard delete process:", error);
  }
});

