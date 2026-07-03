const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { 
    folder: "placementconnect", 
    allowed_formats: ["jpg", "jpeg", "png", "pdf"], // Allowed file formats
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
