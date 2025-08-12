// src/services/storage/StorageService.js
const fs = require('fs');
const path = require('path');

// Untuk mengatasi warning AWS SDK v2, kita bisa menggunakan conditional import
let AWS = null;
if (process.env.AWS_BUCKET_NAME) {
  try {
    AWS = require('aws-sdk');
  } catch (error) {
    console.warn('AWS SDK not available, local storage only');
  }
}

class StorageService {
  constructor() {
    if (AWS) {
      this._S3 = new AWS.S3();
    }
    
    // Pastikan direktori upload ada
    const uploadDir = path.resolve(__dirname, '../../../uploads/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created uploads/images directory');
    }
  }

  writeFile(file, meta) {
    const filename = +new Date() + meta.filename;
    const filePath = path.resolve(__dirname, '../../../uploads/images', filename);

    const fileStream = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      fileStream.on('error', (error) => {
        console.error('File write error:', error);
        reject(error);
      });
      
      fileStream.on('finish', () => {
        console.log(`✅ File saved locally: ${filename}`);
        resolve(filename);
      });

      file.pipe(fileStream);
      
      file.on('error', (error) => {
        console.error('File stream error:', error);
        reject(error);
      });
    });
  }

  createPresignedUrl({ bucket, key, expires }) {
    if (!this._S3) {
      throw new Error('AWS S3 not configured');
    }
    
    return this._S3.getSignedUrl('getObject', {
      Bucket: bucket,
      Key: key,
      Expires: expires,
    });
  }

  async uploadFile(file, meta) {
    if (!this._S3) {
      throw new Error('AWS S3 not configured');
    }

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const parameter = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: +new Date() + meta.filename,
      Body: buffer,
      ContentType: meta.headers['content-type'],
    };

    const uploadResult = await this._S3.upload(parameter).promise();
    console.log(`✅ File uploaded to S3: ${uploadResult.Location}`);
    return uploadResult.Location;
  }
}

module.exports = StorageService;