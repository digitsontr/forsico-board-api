const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const List = require('./list');

const BoardSchema = new Schema({
    id: String,
    name: String,
    description: String,
    media: [String],
    lists: [List.schema]
});

module.exports = {
    model: mongoose.model('Board', BoardSchema),
    schema: BoardSchema
} 
