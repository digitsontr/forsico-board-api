const Task = require("../models/task");
const TaskStatus = require("../models/taskStatus");
const List = require("../models/list");
const Board = require("../models/board");
const { Workspace } = require("../models/workspace");
const User = require("../models/user");
const mongoose = require("mongoose");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const Logger = require("../scripts/logger/task");
const ExceptionLogger = require("../scripts/logger/exception");
const { v4: uuidv4 } = require("uuid");
const {
	logAndPublishNotification,
	detectTaskChanges,
} = require("../services/notification");
const commentService = require("./comment");
const checklistService = require("./checklist");
const userService = require("../services/user");

const getTasksOfBoard = async (boardId, workspaceId) => {
	try {
		console.log("board id", boardId);
		const tasks = await Task.find({
			boardId: boardId,
			workspaceId: workspaceId,
		})
			.populate("assignee", "firstName lastName profilePicture")
			.populate([
				{
					path: "comments",
					populate: {
						path: "userId",
						select: "firstName lastName profilePicture",
					},
				},
				{ path: "members", select: "_id id firstName lastName profilePicture" },
			])
			.populate("statusId", "_id name");
		console.log("Tasks", tasks);
		return ApiResponse.success(tasks);
	} catch (e) {
		console.error(e);
		return ApiResponse.fail([new ErrorDetail("Failed to retrieve tasks")]);
	}
};

const getTaskById = async (id) => {
	try {
		console.log("ID:", id);
		const task = await Task.findById(
			id,
			"_id name description boardId assignee dueDate ownerId priority entranceDate listId statusId createdAt updatedAt parentTask"
		)
			.populate("assignee", "firstName lastName profilePicture")
			.populate("ownerId", "firstName lastName profilePicture")
			.populate("members", "id _id firstName lastName profilePicture")
			.populate("statusId", "_id name");
		if (!task) {
			return ApiResponse.fail([new ErrorDetail("Task not found")]);
		}
		return ApiResponse.success(task);
	} catch (e) {
		console.error("ERR: ", e);
		return ApiResponse.fail([new ErrorDetail("Failed to retrieve task")]);
	}
};

const updateTaskStatus = async (taskId, newStatusId, userId) => {
	try {
		const user = await User.findOne(
			{ id: userId },
			"_id id firstName lastName profilePicture"
		);

		const task = await Task.findById(taskId);
		if (!task) {
			return ApiResponse.fail([new ErrorDetail("Task not found")]);
		}

		const status = await TaskStatus.findById(newStatusId);
		if (!status) {
			return ApiResponse.fail([new ErrorDetail("Status not found")]);
		}

		const newListId = status.listId;
		if (!newListId) {
			return ApiResponse.fail([
				new ErrorDetail("No list associated with the new status"),
			]);
		}

		if (task.listId) {
			const oldList = await List.findById(task.listId);
			if (oldList) {
				oldList.tasks.pull(task._id);
				await oldList.save();
			}
		}

		task.statusId = newStatusId;
		task.listId = newListId;
		await task.save();

		const newList = await List.findById(newListId);
		if (newList) {
			newList.tasks.push(task._id);
			await newList.save();
		}

		const updatedTask = await Task.findById(taskId)
			.populate("assignee", "firstName lastName profilePicture")
			.populate("statusId", "_id name");

		await logAndPublishNotification("Task", "statusChange", {
			user,
			task,
			workspaceId: task.workspaceId,
			boardId: task.boardId,
			taskId: task._id,
			targetId: task._id,
			newStatus: status.name,
		});

		return ApiResponse.success(updatedTask);
	} catch (error) {
		console.error("Failed to update task status:", error);
		return ApiResponse.fail([new ErrorDetail("Failed to update task status")]);
	}
};

const createTask = async (workspaceId, taskData) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const workspace = await Workspace.findById(workspaceId);
		if (!workspace) {
			throw new Error("Workspace not found");
		}

		const user = await User.findOne(
			{ id: taskData.ownerId },
			"_id id firstName lastName profilePicture"
		);
		const assignedUser = await User.findOne({ id: taskData.assignee }, "_id");

		const defaultStatus = await TaskStatus.findOne({
			name: "Backlog",
			boardId: taskData.boardId,
		});

		if (!defaultStatus) {
			throw new Error("Default task status not found");
		}

		const taskModel = new Task({
			name: taskData.name,
			description: taskData.description || "",
			boardId: taskData.boardId,
			assignee: assignedUser?._id || null,
			dueDate: taskData.dueDate || null,
			ownerId: user?._id,
			priority: taskData.priority || 0,
			entranceDate: taskData.entranceDate || Date.now(),
			workspaceId: workspaceId,
			listId: taskData.listId || null,
			statusId: defaultStatus._id,
			members: [user._id],
		});

		if (taskData.parentTask) {
			const parentTask = await Task.findById(taskData.parentTask);
			if (parentTask) {
				parentTask.subtasks.push(taskModel._id);
				await parentTask.save({ session });
			}
			taskModel.parentTask = taskData.parentTask;
		}

		if (taskData.listId) {
			const list = await List.findById(taskData.listId);
			if (list) {
				list.tasks.push(taskModel._id);
				await list.save({ session });
			}
		}

		const savedTask = await taskModel.save({ session });
		const populatedTask = await Task.findById(savedTask._id)
			.populate("assignee", "firstName lastName email profilePicture")
			.session(session);

		await logAndPublishNotification("Task", "newTask", {
			user,
			task: savedTask,
			workspaceId: workspaceId,
			taskId: savedTask._id,
			boardId: savedTask.boardId,
			targetId: savedTask._id,
		});

		await session.commitTransaction();
		session.endSession();
		return ApiResponse.success(populatedTask);
	} catch (e) {
		await session.abortTransaction();
		session.endSession();
		Logger.log({
			level: "error",
			message: `Error creating task: ${e.message}`,
		});
		return ApiResponse.fail([new ErrorDetail("Failed to create task")]);
	}
};

const updateTask = async (id, updateData, userId) => {
	try {
		const user = await User.findOne(
			{ id: userId },
			"_id id firstName lastName profilePicture"
		);

		const task = await Task.findById(id);
		if (!task) {
			return ApiResponse.fail([new ErrorDetail("Task not found")]);
		}

		const updatedTask = await Task.findByIdAndUpdate(id, updateData, {
			new: true,
		});

		if (!updatedTask) {
			return ApiResponse.fail([
				new ErrorDetail("Task not found or update failed"),
			]);
		}

		if (updateData.listId && task.listId.toString() !== updateData.listId) {
			const taskIds = [task._id, ...task.subtasks.map((subtask) => subtask)];

			const newStatus = await TaskStatus.findOne({ listId: updateData.listId });

			console.log("NEW STATUS", newStatus);
			
			await Promise.allSettled(
				taskIds.map(async (taskId) => {
					await moveTaskToNewList(taskId, task.listId, updateData.listId);

					if (newStatus) {
						await Task.findByIdAndUpdate(taskId, { statusId: newStatus._id });
					}
				})
			);
		}

		if (
			updateData.statusId &&
			task.statusId.toString() !== updateData.statusId
		) {
			const newStatus = await TaskStatus.findById(updateData.statusId);
			if (newStatus && newStatus.listId) {
				const oldList = await List.findById(task.listId);
				if (oldList) {
					oldList.tasks.pull(task._id);
					await oldList.save();
				}

				const newList = await List.findById(newStatus.listId);
				if (newList) {
					newList.tasks.push(task._id);
					await newList.save();
				}

				await Task.findByIdAndUpdate(id, { listId: newStatus.listId });
			}
		}

		const changes = detectTaskChanges(task, updateData);
		if (changes.length > 0) {
			await logAndPublishNotification("Task", "updateTask", {
				user,
				task: updatedTask,
				changes,
				taskId: task._id,
				workspaceId: task.workspaceId,
				boardId: task.boardId,
				targetId: task._id,
			});
		}

		return ApiResponse.success(updatedTask);
	} catch (e) {
		return ApiResponse.fail([new ErrorDetail("Failed to update task")]);
	}
};

const searchTasks = async (searchData, userId) => {
	const { query, page = 1, limit = 10, workspaceIds } = searchData;
	const user = await User.findOne({ id: userId }, "_id");
	const workspaces = (
		await Workspace.find({ members: user._id, isDeleted: false }, "_id")
	).map((ws) => ws._id.toString());

	try {
		const tasks = await Task.find({
			workspaceId: {
				$in: workspaceIds.filter((id) => workspaces.includes(id)),
			},
			isDeleted: false,
			$text: { $search: query },
		})
			.populate("boardId", "_id name")
			.populate("statusId", "_id name")
			.skip((page - 1) * limit)
			.limit(limit);

		console.log(tasks);

		const queryWords = query.split(/\s+/);

		const filteredResults = tasks.filter(
			(task) =>
				queryWords.every((word) =>
					new RegExp(word, "i").test((task.name || "").replace(/\s+/g, ""))
				) ||
				queryWords.every((word) =>
					new RegExp(word, "i").test(
						(task.description || "").replace(/\s+/g, "")
					)
				)
		);

		console.log(filteredResults);

		return ApiResponse.success(filteredResults);
	} catch (error) {
		return ApiResponse.fail([new ErrorDetail(error.message, false)]);
	}
};

const deleteTask = async (taskId, deletionId) => {
	try {
		deletionId = deletionId || uuidv4();

		const updatedTask = await Task.findByIdAndUpdate(taskId, {
			isDeleted: true,
			deletedAt: new Date(),
			deletionId: deletionId,
		});

		Logger.log("info", `TASK ${taskId} REMOVED DELETION ID: ${deletionId}`);

		await commentService.deleteCommentsByTask(taskId, deletionId);
		await checklistService.deleteChecklistByTask(taskId, deletionId);

		return ApiResponse.success(updatedTask);
	} catch (e) {
		return ApiResponse.fail([new ErrorDetail("Failed to delete task")]);
	}
};

const moveTasksToFirstList = async (listId) => {
	const tasks = await Task.find({ listId, isDeleted: false });
	const firstList = await List.findOne({ boardId: tasks[0]?.boardId }).sort({
		createdAt: 1,
	});

	const results = await Promise.allSettled(
		tasks.map(async (task) => {
			const updatedTask = await Task.findByIdAndUpdate(task._id, {
				listId: firstList._id,
			});

			await moveTaskToNewList(task._id, listId, firstList._id);
		})
	);

	results.forEach((result, index) => {
		if (result.status === "rejected") {
			Logger.log(
				"error",
				`List ${lists[index]._id} can't be removed:`,
				result.reason
			);
		}
	});
};

const deleteTaskByBoard = async (boardId, deletionId) => {
	Logger.log(
		"info",
		"TASK REMOVE OPERATION STARTED DELETION ID: " + deletionId
	);

	const tasks = await Task.find({ boardId });

	const results = await Promise.allSettled(
		tasks.map(async (list) => {
			await deleteTask(list._id, deletionId);
		})
	);

	results.forEach((result, index) => {
		if (result.status === "rejected") {
			Logger.log(
				"error",
				`Task ${tasks[index]._id} can't be removed:`,
				result.reason
			);
		}
	});

	Logger.log("info", "TASK REMOVE OPERATION ENDED DELETION ID: " + deletionId);

	return true;
};

const moveTaskToNewList = async (taskId, oldListId, newListId) => {
	const oldList = await List.findById(oldListId);
	if (oldList) {
		oldList.tasks.pull(taskId);
		await oldList.save();
	}

	const newList = await List.findById(newListId);
	if (newList) {
		newList.tasks.push(taskId);
		await newList.save();
	}
};

const addMemberToTask = async (taskId, userData) => {
	try {
		const task = await Task.findById(taskId);

		if (!task) {
			return ApiResponse.fail([new ErrorDetail("Task not found")]);
		}

		const user = await userService.getUserById(userData.userId);

		if (!user) {
			return ApiResponse.fail([new ErrorDetail("User not found")]);
		}

		const board = await Board.findById(task.boardId);

		if (!board) {
			return ApiResponse.fail([new ErrorDetail("Board not found")]);
		}

		if (!board.members.includes(user._id)) {
			return ApiResponse.fail([
				new ErrorDetail("User is not a member of the board"),
			]);
		}

		if (!task.members.includes(user._id)) {
			task.members.push(user._id);
			await task.save();
		} else {
			return ApiResponse.fail([
				new ErrorDetail("User is already a member of this task"),
			]);
		}

		return ApiResponse.success(task);
	} catch (e) {
		console.error(e);
		return ApiResponse.fail([new ErrorDetail("Failed to add member to task")]);
	}
};

const removeMemberFromTask = async (taskId, userId) => {
	try {
		const task = await Task.findById(taskId);

		if (!task) {
			return ApiResponse.fail([new ErrorDetail("Task not found")]);
		}

		const user = await userService.getUserById(userId);

		if (!user) {
			return ApiResponse.fail([new ErrorDetail("User not found")]);
		}

		const memberIndex = task.members.indexOf(user._id);

		if (memberIndex === -1) {
			return ApiResponse.fail([
				new ErrorDetail("User is not a member of this task"),
			]);
		}

		task.members.splice(memberIndex, 1);
		await task.save();

		return ApiResponse.success(task);
	} catch (e) {
		console.error(e);
		return ApiResponse.fail([
			new ErrorDetail("Failed to remove member from task"),
		]);
	}
};

const getUserTasks = async (userId, subscriptionId) => {
	try {
		const user = await User.findOne({ id: userId }, "_id");
		if (!user) {
			return ApiResponse.fail([new ErrorDetail("User not found")]);
		}

		const workspaces = await Workspace.find({
			members: user._id,
			isDeleted: false,
			subscriptionId: subscriptionId
		}).select("_id name");

		if (workspaces.length === 0) {
			return ApiResponse.success([]);
		}

		const workspaceTasks = await Promise.all(
			workspaces.map(async (workspace) => {
				const tasks = await Task.find({
					workspaceId: workspace._id,
					isDeleted: false,
					$or: [{ members: user._id }, { assignee: user._id }],
				})
					.select(
						"name boardId assignee dueDate priority subtasks statusId parentTask listId"
					)
					.populate({
						path: "statusId",
						select: "_id name color",
						model: "TaskStatus"
					})
					.populate({
						path: "listId",
						select: "_id name",
						model: "List"
					})
					.populate({
						path: "assignee",
						select: "firstName lastName profilePicture",
						model: "User"
					});

				tasks.forEach(task => {
					if (!task.statusId) {
						console.log(`Task ${task._id} has no status`);
					}
				});

				return {
					id: workspace._id,
					name: workspace.name,
					tasks,
				};
			})
		);

		return ApiResponse.success(workspaceTasks);
	} catch (e) {
		console.error("Error retrieving user tasks: ", e);
		return ApiResponse.fail([new ErrorDetail("Failed to retrieve user tasks")]);
	}
};

const changeTaskAssignee = async (taskId, newAssigneeId, userId) => {
	try {
		const task = await Task.findById(taskId);
		if (!task) {
			return ApiResponse.fail([new ErrorDetail("Task not found")]);
		}

		const user = await User.findOne(
			{ id: userId },
			"_id id firstName lastName profilePicture"
		);
		const toUser = await User.findOne({ id: newAssigneeId }, "_id id");

		task.assignee = toUser._id;
		await task.save();

		await logAndPublishNotification("Task", "assigneeChange", {
			user,
			task,
			workspaceId: task.workspaceId,
			boardId: task.boardId,
			taskId: task._id,
			targetId: task._id,
			newAssigneeId: newAssigneeId,
		});

		const updatedTask = await Task.findById(taskId).populate(
			"assignee",
			"firstName lastName profilePicture"
		);

		return ApiResponse.success(updatedTask);
	} catch (e) {
		Logger.log({
			level: "error",
			message: `Error changing assignee: ${e.message}`,
		});
		return ApiResponse.fail([new ErrorDetail("Failed to change assignee")]);
	}
};

const changeTaskBoard = async (taskId, newBoardId, newListId, userId) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const task = await Task.findById(taskId).session(session);
		if (!task) {
			throw new Error("Task not found");
		}

		const oldListId = task.listId;

		if (oldListId) {
			const oldList = await List.findById(oldListId).session(session);
			if (oldList) {
				oldList.tasks.pull(task._id);
				await oldList.save({ session });
			}
		}

		const newStatus = await TaskStatus.findOne({ listId: newListId }).session(
			session
		);
		if (!newStatus) {
			throw new Error("No status associated with the new list");
		}

		task.boardId = newBoardId;
		task.listId = newListId;
		task.statusId = newStatus._id;
		await task.save({ session });

		const newList = await List.findById(newListId).session(session);
		if (newList) {
			newList.tasks.push(task._id);
			await newList.save({ session });
		}

		const subtasks = await Task.find({ parentTask: taskId }).session(session);
		await Promise.all(
			subtasks.map(async (subtask) => {
				if (oldListId) {
					const oldList = await List.findById(oldListId).session(session);
					if (oldList) {
						oldList.tasks.pull(subtask._id);
						await oldList.save({ session });
					}
				}

				subtask.boardId = newBoardId;
				subtask.listId = newListId;
				subtask.statusId = newStatus._id;
				await subtask.save({ session });

				if (newList) {
					newList.tasks.push(subtask._id);
					await newList.save({ session });
				}
			})
		);

		const user = await User.findOne(
			{ id: userId },
			"_id id firstName lastName profilePicture"
		);

		await logAndPublishNotification("Task", "boardChange", {
			user,
			task,
			workspaceId: task.workspaceId,
			boardId: task.boardId,
			taskId: task._id,
			targetId: task._id,
			newBoardId: newBoardId,
		});

		await session.commitTransaction();
		session.endSession();
		return ApiResponse.success(task);
	} catch (e) {
		await session.abortTransaction();
		session.endSession();
		Logger.log({
			level: "error",
			message: `Error changing task board: ${e.message}`,
		});
		return ApiResponse.fail([new ErrorDetail("Failed to change task board")]);
	}
};

module.exports = {
	getTasksOfBoard,
	getTaskById,
	createTask,
	updateTask,
	deleteTask,
	updateTaskStatus,
	searchTasks,
	moveTasksToFirstList,
	deleteTaskByBoard,
	addMemberToTask,
	getUserTasks,
	removeMemberFromTask,
	changeTaskAssignee,
	changeTaskBoard,
};
