const mongoose = require("mongoose");
const { Workspace } = require("../../models/workspace");
const User = require("../../models/user");
const axios = require("axios");
const { connectDB } = require("../../loaders/db");
const Logger = require("../logger/workspace");

const FREE_PLAN_ID = "672a6e4be2bc700de8c7d40b";
const FREE_PLAN_LIMITS = {
	WORKSPACE_LIMIT: 1,
	USER_LIMIT: 10,
};

const createFreeSubscription = async (ownerId, retryCount = 0) => {
	const MAX_RETRIES = 3;
	const RETRY_DELAY = 1000;

	try {
		const response = await axios.post(
			`https://forsico-subscription-service-hmh5asdyb2dqc8gv.eastus-01.azurewebsites.net/api/user/create_subs_for_script`,
			{
				user_id: ownerId,
				subscription_type_id: FREE_PLAN_ID,
			}
		);

		// Başarılı response
		if (response.data?.request_id) {
			return response.data.request_id; // request_id'yi subscription ID olarak kullan
		}

		// request_id yoksa retry
		if (retryCount >= MAX_RETRIES) {
			throw new Error(`Failed to get request_id after ${MAX_RETRIES} attempts`);
		}

		Logger.log("info", `No request_id in response, retrying... (attempt ${retryCount + 1})`);
		await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));

		return createFreeSubscription(ownerId, retryCount + 1);

	} catch (error) {
		// 400 response'da request_id var mı kontrol et
		const rId =error.request_id || error.response.data.request_id;
		if (rId) {
			return rId; // 400 olsa bile request_id varsa kullan
		}

		// Diğer hata durumları için retry
		const errorMessage = error.response?.data?.message || error.message;
		Logger.log("error", `Failed to create subscription (attempt ${retryCount + 1}): ${errorMessage}`);
		
		if (retryCount < MAX_RETRIES) {
			Logger.log("info", `Retrying subscription creation for owner ${ownerId}`);
			await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
			return createFreeSubscription(ownerId, retryCount + 1);
		}
		
		throw new Error(`Failed to create subscription after ${MAX_RETRIES} attempts: ${errorMessage}`);
	}
};

const migrateToFreeSubscriptions = async () => {
	try {
		await connectDB();
		Logger.log("info", "=== Starting Migration Process ===");
		Logger.log("info", `Using Free Plan ID: ${FREE_PLAN_ID}`);
		Logger.log("info", `Limits: ${JSON.stringify(FREE_PLAN_LIMITS)}`);

		// 1. Tüm workspaceleri owner'larına göre grupla
		const workspaces = await Workspace.find({
			subscriptionId: FREE_PLAN_ID,
			isDeleted: false,
		})
			.populate({
				path: "owner",
				select: "id firstName lastName _id",
			})
			.populate({
				path: "members",
				select: "id firstName lastName createdAt",
			})
			.sort({ createdAt: 1 });

		Logger.log("info", `Found ${workspaces.length} total workspaces to process`);

		const ownerGroups = new Map();
		workspaces.forEach((workspace) => {
			const owner = workspace.owner[0];
			console.log("OWNER",owner);
			const ownerId = owner.id;
			if (!ownerGroups.has(ownerId)) {
				ownerGroups.set(ownerId, []);
			}
			ownerGroups.get(ownerId).push(workspace);
		});

		Logger.log("info", `Found ${ownerGroups.size} unique owners to process`);

		// 2. Her owner grubu için işlem yap
		let successCount = 0;
		let failureCount = 0;

		for (const [ownerId, ownerWorkspaces] of ownerGroups) {
			Logger.log("info", `\n=== Processing Owner: ${ownerId} ===`);
			Logger.log("info", `Total workspaces for owner: ${ownerWorkspaces.length}`);
			
			const session = await mongoose.startSession();
			session.startTransaction();

			try {
				// 2.1. Free subscription oluştur
				Logger.log("info", `Creating free subscription for owner ${ownerId}...`);
				const newSubscriptionId = await createFreeSubscription(ownerId);
				if (!newSubscriptionId) {
					throw new Error(`Failed to create subscription for owner ${ownerId}`);
				}
				Logger.log("info", `Created subscription: ${newSubscriptionId}`);

				// 2.2. Workspace sayısını kontrol et
				const workspacesToKeep = ownerWorkspaces.slice(0, FREE_PLAN_LIMITS.WORKSPACE_LIMIT);
				const workspacesToDelete = ownerWorkspaces.slice(FREE_PLAN_LIMITS.WORKSPACE_LIMIT);

				Logger.log("info", `Workspaces to keep: ${workspacesToKeep.length}`);
				Logger.log("info", `Workspaces to delete: ${workspacesToDelete.length}`);

				// 2.3. Korunacak workspaceleri güncelle
				for (const workspace of workspacesToKeep) {
					const owner = workspace.owner[0];
					const currentMemberCount = workspace.members.length;
					
					Logger.log("info", `Processing workspace: ${workspace._id}`);
					Logger.log("info", `Current member count: ${currentMemberCount}`);
					
					await Workspace.findByIdAndUpdate(
						workspace._id,
						{
							$set: {
								subscriptionId: newSubscriptionId,
								members: [owner._id],
							},
						},
						{ session }
					);

					Logger.log(
						"info",
						`Updated workspace ${workspace._id}:\n` +
						`  - New subscription: ${newSubscriptionId}\n` +
						`  - Removed ${currentMemberCount - 1} members\n` +
						`  - Only owner remains as member`
					);
				}

				// 2.4. Fazla workspaceleri soft-delete
				if (workspacesToDelete.length > 0) {
					const deletionId = new mongoose.Types.ObjectId();
					Logger.log("info", `Deleting excess workspaces with deletionId: ${deletionId}`);
					
					await Workspace.updateMany(
						{ _id: { $in: workspacesToDelete.map((w) => w._id) } },
						{
							$set: {
								isDeleted: true,
								deletedAt: new Date(),
								deletionId: deletionId,
							},
						},
						{ session }
					);

					Logger.log(
						"info",
						`Deleted ${workspacesToDelete.length} excess workspaces:\n` +
						workspacesToDelete.map(w => `  - ${w._id} (${w.name})`).join('\n')
					);
				}

				await session.commitTransaction();
				Logger.log(
					"info",
					`✓ Successfully completed migration for owner ${ownerId}`
				);
				successCount++;
			} catch (error) {
				await session.abortTransaction();
				// Sadece hata mesajını logla
				Logger.log("error", `✗ Failed to migrate owner ${ownerId}: ${error.message}`);
				failureCount++;
			} finally {
				session.endSession();
			}
		}

		Logger.log("info", "\n=== Migration Summary ===");
		Logger.log("info", `Total owners processed: ${ownerGroups.size}`);
		Logger.log("info", `Successful migrations: ${successCount}`);
		Logger.log("info", `Failed migrations: ${failureCount}`);
		Logger.log("info", "Migration completed");
		
		process.exit(0);
	} catch (error) {
		Logger.error("Critical migration failure:", error);
		process.exit(1);
	}
};

// Script'i çalıştır
migrateToFreeSubscriptions();
