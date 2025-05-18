/**
 * Cloudinary upload utility for the Card Entry Helper
 */
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload an image to Cloudinary
 * @param {string} imagePath - Local path to the image
 * @param {string} publicId - Public ID for the image
 * @returns {Promise<object>} - Cloudinary upload result
 */
async function uploadImage(imagePath, publicId) {
  try {
    console.log(`Uploading ${path.basename(imagePath)} to Cloudinary...`);

    // Check if the file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found: ${imagePath}`);
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      folder: "algomancy/cards",
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    });

    console.log(
      `Uploaded ${path.basename(imagePath)} to Cloudinary: ${result.secure_url}`
    );
    return result;
  } catch (error) {
    console.error(
      `Error uploading ${path.basename(imagePath)} to Cloudinary:`,
      error
    );
    throw error;
  }
}

module.exports = {
  uploadImage,
};
