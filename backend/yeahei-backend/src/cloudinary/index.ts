import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

// 環境変数からの読み取りを安全に行うための小さなヘルパー関数
function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

// Cloudinaryの設定
cloudinary.config({
  cloud_name: getEnvVariable('CLOUDINARY_CLOUD_NAME'),
  api_key: getEnvVariable('CLOUDINARY_API_KEY'),
  api_secret: getEnvVariable('CLOUDINARY_API_SECRET'),
});

// アップロードプリセットの作成
cloudinary.api.create_upload_preset({
  name: 'yeah-diary-ver3',
  folder: 'yeah-diary-ver3'
}, (error: UploadApiErrorResponse, result: UploadApiResponse) => {
  if (error) {
    console.error("Cloudinary Upload Preset Error:", error);
    return;
  }
  console.log("Cloudinary Upload Preset Result:", result);
});

export default cloudinary;
