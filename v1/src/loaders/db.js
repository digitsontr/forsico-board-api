const Mongoose = require("mongoose");

const connectDB = async () => {
  await Mongoose.connect(process.env.CON_STRING);
};

module.exports = {
  connectDB,
};
