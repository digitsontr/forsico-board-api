const Comment = require("../models/comment");
const Task = require("../models/task");
const User = require("../models/user");
const { ApiResponse, ErrorDetail } = require("../models/apiresponse");

const getCommentsForTask = async (taskId) => {
  try {
    const comments = await Comment.find({ task_id: taskId }).populate(
      "user_id",
      "firstname lastname profilePicture"
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
      "user_id",
      "firstname lastname profilePicture"
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

const createComment = async (workspaceId, userId, commentData) => {
  try {
    const user = await User.findOne({ id: userId }, "_id");
    const task = await Task.findById(commentData.taskid);

    if (!task) {
      return ApiResponse.fail([new ErrorDetail("Task not found")]);
    }

    const comment = new Comment({
      content: commentData.content,
      files: commentData.fileUrls || [],
      task_id: commentData.taskid,
      user_id: user._id,
      workspaceId,
    });

    const savedComment = await comment.save();
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
      user_id: user._id,
    });

    console.log("COMMENT:", comment);

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
  try {
    const user = await User.findOne({ id: userId }, "_id");
    const deletedComment = await Comment.findOneAndDelete({
      _id: commentId,
      user_id: user._id,
    });

    if (!deletedComment) {
      return ApiResponse.fail([
        new ErrorDetail("Comment not found or delete failed"),
      ]);
    }

    return ApiResponse.success(deletedComment);
  } catch (e) {
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
