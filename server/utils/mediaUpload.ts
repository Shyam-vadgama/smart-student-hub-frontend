import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import streamifier from 'streamifier';

// Function to upload media to Cloudinary
export const uploadMediaToCloudinary = (
  fileBuffer: Buffer,
  folder: string = 'social_media'
): Promise<UploadApiResponse | UploadApiErrorResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto', // Automatically detect resource type (image/video)
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result!);
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// Function to delete media from Cloudinary
export const deleteMediaFromCloudinary = (publicId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};