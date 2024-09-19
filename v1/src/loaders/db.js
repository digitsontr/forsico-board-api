const Mongoose = require('mongoose');
const KeyVaultClient = require('./keyvault')

const connectDB = async () => {
  await Mongoose.connect(await KeyVaultClient.getSecretValue('BoardApi-CONSTRING'));
};

module.exports = {
  connectDB,
};
