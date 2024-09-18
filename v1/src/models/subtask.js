const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubTaskSchema = new Schema({
    id: String,
    name: String,
    description: String,
    media: [String],
    assignee: String,
    due_date: Date,
    owner_id: String,
    priority: Number,
    entrance_date: Date,
});

module.exports = {
    model: mongoose.model('SubTask', SubTaskSchema),
    schema : SubTaskSchema
} 
