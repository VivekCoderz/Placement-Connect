const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.cloud_name,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.api_key,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.api_secret
});

module.exports = cloudinary;
