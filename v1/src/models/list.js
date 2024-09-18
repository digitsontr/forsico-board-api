const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ListSchema = new Schema({
    id: String,
    name: String,
});

module.exports = {
    model: mongoose.model('List', ListSchema),
    schema: ListSchema
}
