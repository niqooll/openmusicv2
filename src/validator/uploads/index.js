const InvariantError = require('../../exceptions/InvariantError');
const { ImageHeadersSchema } = require('./schema');

const UploadsValidator = {
  validateImageHeaders: (headers) => {
    // Normalisasi semua key jadi lowercase
    const normalizedHeaders = Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
    );

    const validationResult = ImageHeadersSchema.validate(normalizedHeaders);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = UploadsValidator;
