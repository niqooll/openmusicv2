const InvariantError = require('../../exceptions/InvariantError');

const UploadsValidator = {
  validateImageHeaders: (headers) => {
    if (!headers) {
      throw new InvariantError('Headers are required');
    }

    // Normalisasi key header menjadi lowercase untuk konsistensi
    const normalizedHeaders = {};
    Object.keys(headers).forEach((key) => {
      normalizedHeaders[key.toLowerCase()] = headers[key];
    });

    const contentType = normalizedHeaders['content-type'];

    if (!contentType) {
      throw new InvariantError('Content-Type header is required');
    }

    const validImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/avif',
      'image/apng',
    ];

    // Ekstrak tipe MIME utama (sebelum ';')
    const mainContentType = contentType.split(';')[0].trim().toLowerCase();

    if (!validImageTypes.includes(mainContentType)) {
      throw new InvariantError(`Unsupported Media Type. Tipe berkas harus salah satu dari: ${validImageTypes.join(', ')}`);
    }
  },
};

module.exports = UploadsValidator;