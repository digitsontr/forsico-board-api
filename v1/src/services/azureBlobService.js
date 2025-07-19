const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const ExceptionLogger = require("../scripts/logger/exception");

const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING; //TODO Create new blob storage for this attachments
const containerName = "comment-attachments";

const blobServiceClient = BlobServiceClient.fromConnectionString(
  AZURE_STORAGE_CONNECTION_STRING
);

const uploadFileToBlob = async (file) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);

    await containerClient.createIfNotExists();

    const blobName = `${uuidv4()}-${file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, file.size);

    return blockBlobClient.url;
  } catch (error) {
    console.error("Error uploading file to Azure Blob Storage:", error.message);
    throw new Error("Failed to upload file to Azure Blob Storage");
  }
};

const deleteFileFromBlob = async (fileUrl) => {
  try {
    const urlParts = fileUrl.split("/");
    const blobName = urlParts[urlParts.length - 1];
    const containerName = urlParts[urlParts.length - 2];
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.deleteIfExists();
    console.info(
      `File ${blobName} deleted successfully from Azure Blob Storage`
    );
  } catch (error) {
    console.error(
      "Error deleting file from Azure Blob Storage:",
      error.message
    );
  }
};

module.exports = { uploadFileToBlob, deleteFileFromBlob };
