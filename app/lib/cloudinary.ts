import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';

// Load environment variables
config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

/**
 * Upload an image to Cloudinary
 * @param imagePath Local path or URL of the image
 * @param publicId Optional public ID for the image
 * @returns Cloudinary upload result
 */
export async function uploadImage(imagePath: string, publicId?: string) {
  try {
    const options: any = {
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      folder: 'algomancy/cards',
    };

    if (publicId) {
      options.public_id = publicId;
    }

    const result = await cloudinary.uploader.upload(imagePath, options);
    return result;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
}

/**
 * Get a Cloudinary URL for an image
 * @param publicId Public ID of the image
 * @returns Cloudinary URL
 */
export function getImageUrl(publicId: string) {
  return cloudinary.url(publicId, {
    secure: true,
    quality: 'auto',
    fetch_format: 'auto',
  });
}

export default cloudinary;
