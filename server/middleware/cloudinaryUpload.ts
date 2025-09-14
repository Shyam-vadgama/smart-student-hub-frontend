import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'social_media',
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'mkv', 'webm'],
      resource_type: 'auto', // Automatically detect resource type
    };
  }
});

// File filter for media files
const fileFilter = (req: any, file: any, cb: any) => {
  // Allow images and videos
  const allowedTypes = /jpg|jpeg|png|gif|mp4|mov|avi|mkv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed'));
  }
};

export const cloudinaryUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});