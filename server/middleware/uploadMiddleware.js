const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");

const hasCloudinaryConfig =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

const uploadDir = path.join(__dirname, "..", "uploads");

if (!hasCloudinaryConfig && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const storage = hasCloudinaryConfig ? multer.memoryStorage() : localStorage;
const baseUpload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024),
  },
});

const uploadBufferToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || "saba-chips-store",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });

const attachStoredFileUrl = async (req, res, next) => {
  try {
    if (!req.file) {
      next();
      return;
    }

    if (!hasCloudinaryConfig) {
      req.file.storageUrl = `/uploads/${req.file.filename}`;
      next();
      return;
    }

    const result = await uploadBufferToCloudinary(req.file);
    req.file.storageUrl = result.secure_url;
    req.file.cloudinaryPublicId = result.public_id;
    next();
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    res.status(500).json({ message: "Image upload failed" });
  }
};

const upload = {
  single: (fieldName) => [baseUpload.single(fieldName), attachStoredFileUrl],
};

module.exports = upload;
