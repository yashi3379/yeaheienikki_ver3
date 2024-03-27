import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.api.create_upload_preset({
  name: 'yeah-diary-ver3',
  folder: 'yeah-diary-ver3'
}, (error, result) => {
  if (error) {
    console.error("Cloudinary Upload Preset Error:", error);
    return;
  }
  console.log("Cloudinary Upload Preset Result:", result);
});

export default cloudinary;
