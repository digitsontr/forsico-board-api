const Comment = require("../models/comment");
const Task = require("../models/task");
const User = require("../models/user");
const { ApiResponse, ErrorDetail } = require("../models/apiresponse");
const ExceptionLogger = require("../scripts/logger/exception");
const Logger = require("../scripts/logger/comment");


const getCommentsForTask = async (taskId) => {
  try {
    const comments = await Comment.find({ taskId: taskId }).populate(
      "userId",
      "firstName lastName profilePicture"
    );
    return ApiResponse.success(comments);
  } catch (e) {
    console.error("Error retrieving comments:", e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve comments")]);
  }
};

const getCommentById = async (commentId) => {
  try {
    const comment = await Comment.findById(commentId).populate(
      "userId",
      "firstName lastName profilePicture"
    );
    if (!comment) {
      return ApiResponse.fail([new ErrorDetail("Comment not found")]);
    }
    return ApiResponse.success(comment);
  } catch (e) {
    console.error("Error retrieving comment:", e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve comment")]);
  }
};

const createComment = async (workspaceId, userId, taskId, commentData) => {
  try {
    const user = await User.findOne({ id: userId }, "_id");
    const task = await Task.findById(taskId);

    if (!task) {
      return ApiResponse.fail([new ErrorDetail("Task not found")]);
    }

    const comment = new Comment({
      content: commentData.content,
      files: commentData.fileUrls || [],
      task: commentData.task,
      userId: user._id,
      taskId: taskId,
      workspaceId,
    });

    const savedComment = await comment.save();

    await Task.findByIdAndUpdate(task, {
      $push: { comments: savedComment._id },
    });

    return ApiResponse.success(savedComment);
  } catch (e) {
    console.error("Error creating comment:", e);
    return ApiResponse.fail([new ErrorDetail("Failed to create comment")]);
  }
};

const updateComment = async (commentId, userId, updateData) => {
  try {
    const user = await User.findOne({ id: userId }, "_id");
    const comment = await Comment.findOne({
      _id: commentId,
      userId: user._id,
    });

    if (!comment) {
      return ApiResponse.fail([
        new ErrorDetail("Comment not found or update failed"),
      ]);
    }

    comment.content = updateData.content;
    comment.files = updateData.fileUrls || [];
    comment.updatedAt = Date.now();

    const updatedComment = await comment.save();
    return ApiResponse.success(updatedComment);
  } catch (e) {
    console.error("Error updating comment:", e);
    return ApiResponse.fail([new ErrorDetail("Failed to update comment")]);
  }
};

const deleteComment = async (commentId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findOne({ id: userId }, "_id");
    const deletedComment = await Comment.findOneAndDelete(
      {
        _id: commentId,
        userId: user._id,
      },
      { session }
    );

    if (!deletedComment) {
      await session.abortTransaction();
      session.endSession();
      return ApiResponse.fail([
        new ErrorDetail("Comment not found or delete failed"),
      ]);
    }

    const task = await Task.findOneAndUpdate(
      { _id: deletedComment.taskId },
      { $pull: { comments: deletedComment._id } },
      { session, new: true }
    );

    if (!task) {
      await session.abortTransaction();
      session.endSession();
      return ApiResponse.fail([
        new ErrorDetail("Task not found, but comment deleted"),
      ]);
    }

    await session.commitTransaction();
    session.endSession();

    return ApiResponse.success(deletedComment);
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting comment:", e);
    return ApiResponse.fail([new ErrorDetail("Failed to delete comment")]);
  }
};

module.exports = {
  getCommentsForTask,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
};
