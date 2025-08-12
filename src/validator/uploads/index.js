// src/validator/uploads/index.js
const InvariantError = require('../../exceptions/InvariantError');
const { ImageHeadersSchema } = require('./schema');

const UploadsValidator = {
  validateImageHeaders: (headers) => {
    console.log('🔍 Original headers received:', headers);
    
    if (!headers) {
      throw new InvariantError('Headers are required');
    }

    // Normalisasi semua key jadi lowercase
    const normalizedHeaders = {};
    Object.keys(headers).forEach(key => {
      normalizedHeaders[key.toLowerCase()] = headers[key];
    });

    console.log('🔍 Normalized headers:', normalizedHeaders);

    // Check content-type specifically
    const contentType = normalizedHeaders['content-type'];
    console.log('🔍 Content-Type found:', contentType);

    if (!contentType) {
      throw new InvariantError('Content-Type header is required');
    }

    // Validate content type manually with more permissive approach
    const validImageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/avif',
      'image/apng'
    ];

    // Extract main content type (before any semicolon)
    const mainContentType = contentType.split(';')[0].trim().toLowerCase();
    console.log('🔍 Main content type:', mainContentType);

    if (!validImageTypes.includes(mainContentType)) {
      console.log('❌ Invalid content type. Valid types:', validImageTypes);
      throw new InvariantError(`Unsupported Media Type. Expected image file, got: ${mainContentType}`);
    }

    console.log('✅ Content type validation passed');

    // Also run Joi validation for additional checks
    const validationResult = ImageHeadersSchema.validate(normalizedHeaders);
    if (validationResult.error) {
      console.log('❌ Joi validation error:', validationResult.error.message);
      throw new InvariantError(validationResult.error.message);
    }

    console.log('✅ All validations passed');
  },
};

module.exports = UploadsValidator;