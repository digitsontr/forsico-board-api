const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WorkspaceProgressState = {
  INITIAL: 'INITIAL',
  WAITING_TASKS: 'WAITING_TASKS',
  TASKS_CREATED: 'TASKS_CREATED',
  COMPLETE: 'COMPLETE'
};

const WorkspaceSchema = new Schema(
  {
    id: String,
    name: String,
    description: String,
    boards: [{ type: Schema.Types.ObjectId, ref: "Board" }],
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    owner: [{ type: Schema.Types.ObjectId, ref: "User" }],
    subscriptionId: { 
      type: String, 
      required: true,
      default: "672a6e4be2bc700de8c7d40b" // Free plan ID'si
    },
    progress: {
      state: {
        type: String,
        enum: Object.values(WorkspaceProgressState),
        default: WorkspaceProgressState.INITIAL
      },
      lastUpdated: { type: Date, default: Date.now },
      history: [{
        state: String,
        timestamp: { type: Date, default: Date.now }
      }]
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletionId: { type: String, default: null }
  },
  { versionKey: false, timestamps: true }
);

// Progress state değişikliklerini history'ye ekleyen middleware
WorkspaceSchema.pre('save', function(next) {
  if (this.isModified('progress.state')) {
    this.progress.lastUpdated = new Date();
    this.progress.history.push({
      state: this.progress.state,
      timestamp: new Date()
    });
  }
  next();
});

module.exports = {
  Workspace: mongoose.model("Workspace", WorkspaceSchema),
  WorkspaceProgressState
};
