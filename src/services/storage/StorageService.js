const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

class StorageService {
  constructor() {
    this._S3 = new AWS.S3();
  }

  writeFile(file, meta) {
    const filename = +new Date() + meta.filename;
    const filePath = path.resolve(__dirname, '../../../uploads/images', filename);

    const fileStream = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      fileStream.on('error', (error) => reject(error));
      file.pipe(fileStream);
      file.on('end', () => resolve(filename));
    });
  }

  createPresignedUrl({ bucket, key, expires }) {
    return this._S3.getSignedUrl('getObject', {
      Bucket: bucket,
      Key: key,
      Expires: expires,
    });
  }

  async uploadFile(file, meta) {
    const parameter = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: +new Date() + meta.filename,
      Body: file._data,
      ContentType: meta.headers['content-type'],
    };

    const uploadResult = await this._S3.upload(parameter).promise();
    return uploadResult.Location;
  }
}

module.exports = StorageService;