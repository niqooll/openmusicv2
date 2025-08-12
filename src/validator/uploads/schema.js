// src/validator/uploads/schema.js
const Joi = require('joi');

const ImageHeadersSchema = Joi.object({
  'content-type': Joi.string().pattern(/^image\/(jpeg|jpg|png|gif|webp|svg\+xml|avif|apng)(\s*;.*)?$/i).required().messages({
    'string.pattern.base': 'Content-Type must be a valid image MIME type (image/jpeg, image/png, etc.)',
    'any.required': 'Content-Type header is required'
  }),
}).unknown(true); // Allow other headers

module.exports = { ImageHeadersSchema };