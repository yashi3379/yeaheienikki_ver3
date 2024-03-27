"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
cloudinary_1.v2.api.create_upload_preset({
    name: 'yeah-diary-ver3',
    folder: 'yeah-diary-ver3'
}, (error, result) => {
    if (error) {
        console.error("Cloudinary Upload Preset Error:", error);
        return;
    }
    console.log("Cloudinary Upload Preset Result:", result);
});
exports.default = cloudinary_1.v2;
