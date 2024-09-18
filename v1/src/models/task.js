const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const SubTask = require('./subtask');

const TaskSchema = new Schema({
    id: String,
    name: String,
    description: String,
    board_id: { type: String, ref: 'Board' }, 
    media: [String],
    assignee: String,
    due_date: Date,
    owner_id: String,
    priority: Number,
    entrance_date: Date,
    subtasks: [SubTask.schema]
});

module.exports = {
    model: mongoose.model('Task', TaskSchema),
    schema: TaskSchema
} 
