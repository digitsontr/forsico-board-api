const Mongoose = require('mongoose');

const db = Mongoose.connection;

db.once('open', () => {
    console.log('Successfully connected to db server');
});

const connectDB = async () => {
    console.log(process.env.CON_STRING);
    await Mongoose.connect(process.env.CON_STRING);    
}

module.exports = {
    connectDB 
}