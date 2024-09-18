const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Board = require('./board');
const Logger = require('../scripts/logger/workspace');

const WorkspaceSchema = new Schema({
    id: String,
    name: String,
    description: String,
    media: [String],
    boards: [Board.schema]
}, {versionKey: false, timestamps: true});

WorkspaceSchema.post('save', (doc)=>{
    Logger.log({
        level: "info",
        message: `New record created ${ JSON.stringify(doc) }`
    })
});

module.exports = mongoose.model('Workspace', WorkspaceSchema);
