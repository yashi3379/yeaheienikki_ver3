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

// チェックするアップロードプリセットの名前
const presetName = 'yeah-ei-diary-ver3';

// アップロードプリセットの存在を確認
cloudinary.api.upload_preset(presetName, (error: UploadApiErrorResponse, result: UploadApiResponse) => {
  if (error && error.http_code === 404) {
    // プリセットが存在しない場合、作成する
    cloudinary.api.create_upload_preset({
      name: presetName,
      folder: presetName
    }, (createError: UploadApiErrorResponse, createResult: UploadApiResponse) => {
      if (createError) {
        console.error("Cloudinary Upload Preset Creation Error:", createError);
        return;
      }
      console.log("Cloudinary Upload Preset Created:", createResult);
    });
  } else if (error) {
    // 他のエラーが発生した場合
    console.error("Cloudinary Upload Preset Error:", error);
  } else {
    // プリセットが既に存在する場合
    console.log("Cloudinary Upload Preset Already Exists:", result);
  }
});

export default cloudinary;
