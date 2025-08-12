// src/services/storage/StorageService.js
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk'); // Pastikan AWS SDK diimpor

class StorageService {
  constructor() {
    // Cek jika menggunakan S3
    if (process.env.AWS_BUCKET_NAME) {
      this._S3 = new AWS.S3();
    }
    
    // Pastikan direktori upload lokal ada
    const uploadDir = path.resolve(__dirname, '../../../uploads/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }

  writeFile(file, meta) {
    const filename = `${+new Date()}_${meta.filename}`;
    const filePath = path.resolve(__dirname, '../../../uploads/images', filename);
    const fileStream = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      // Event handler untuk stream tujuan (penulisan file)
      fileStream.on('error', (error) => {
        // Jika ada error saat menulis, hapus file yang mungkin korup
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return reject(error);
      });

      // Event handler untuk stream sumber (payload dari Hapi)
      file.on('error', (error) => {
        // Jika ada error dari sumber (misal, melebihi maxBytes), hapus file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return reject(error);
      });

      // Jika penulisan selesai, resolve dengan nama file
      fileStream.on('finish', () => resolve(filename));

      // Mulai proses piping
      file.pipe(fileStream);
    });
  }

  // Fungsi uploadFile ke S3 Anda sudah baik, tidak perlu diubah
  async uploadFile(file, meta) {
    if (!this._S3) {
      throw new Error('AWS S3 not configured');
    }

    const chunks = [];
    for await (const chunk of file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const parameter = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${+new Date()}_${meta.filename}`,
      Body: buffer,
      ContentType: meta.headers['content-type'],
    };

    const uploadResult = await this._S3.upload(parameter).promise();
    return uploadResult.Location;
  }
}

module.exports = StorageService;