const dotenv = require('dotenv');

dotenv.config();

const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");
const credential = new DefaultAzureCredential();
const client = new SecretClient(process.env.KEYVAULT_URI, credential);
const getSecretValue = async (secretName) =>{
    return client.getSecret(secretName).then((res)=>{
            return res.value;
      });
}

// Service Bus için yeni bir fonksiyon
const getServiceBusConnectionString = async () => {
    return getSecretValue('AuthApi-ServiceBusConnection');
};

module.exports = {
    getSecretValue,
    getServiceBusConnectionString
};