const path = require("path");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");
const ErrorHandler = require("../utils/ErrorHandle");

const MB = 1024 * 1024;

const FILE_TYPES = {
  pdf: {
    label: "PDF",
    extensions: [".pdf"],
    mimetypes: ["application/pdf"],
  },
  image: {
    label: "JPG, PNG or WEBP image",
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    mimetypes: ["image/jpeg", "image/png", "image/webp"],
  },
  csv: {
    label: "CSV",
    extensions: [".csv"],
    // Browsers/OSes report CSV files under several types (Windows often sends vnd.ms-excel).
    mimetypes: [
      "text/csv",
      "application/csv",
      "text/x-csv",
      "application/x-csv",
      "text/plain",
      "application/vnd.ms-excel",
      "application/octet-stream",
    ],
  },
};

// Both the extension and the declared mimetype must be on the allowlist.
const fileFilterFor = (type) => (req, file, cb) => {
  const spec = FILE_TYPES[type];
  const ext = path.extname(file.originalname || "").toLowerCase();
  const mimetype = String(file.mimetype || "").toLowerCase();
  if (spec.extensions.includes(ext) && spec.mimetypes.includes(mimetype)) {
    return cb(null, true);
  }
  return cb(new ErrorHandler(400, `Invalid file type. Please upload a ${spec.label} file.`));
};

const cloudinaryStorage = (allowedFormats) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "placementconnect",
      allowed_formats: allowedFormats,
    },
  });

const limits = (maxBytes) => ({ fileSize: maxBytes, files: 1, fields: 30, fieldSize: 200 * 1024 });

// Resume: PDF only, 5 MB
const uploadResume = multer({
  storage: cloudinaryStorage(["pdf"]),
  limits: limits(5 * MB),
  fileFilter: fileFilterFor("pdf"),
});

// Offer letters: PDF only, 5 MB
const uploadOfferLetter = multer({
  storage: cloudinaryStorage(["pdf"]),
  limits: limits(5 * MB),
  fileFilter: fileFilterFor("pdf"),
});

// Profile pictures: images only, 2 MB
const uploadImage = multer({
  storage: cloudinaryStorage(["jpg", "jpeg", "png", "webp"]),
  limits: limits(2 * MB),
  fileFilter: fileFilterFor("image"),
});

// Shortlists / round results: CSV only, 1 MB, kept in memory for parsing
const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: limits(1 * MB),
  fileFilter: fileFilterFor("csv"),
});

module.exports = {
  uploadResume,
  uploadOfferLetter,
  uploadImage,
  uploadCsv,
  FILE_TYPES,
  MB,
};
