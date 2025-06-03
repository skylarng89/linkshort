const Joi = require('joi');

// Schema for creating a new short link (POST /api/links)
const createLinkSchema = Joi.object({
  originalUrl: Joi.string().uri({
    scheme: [
      /https?/, // Allows http and https
    ],
    allowRelative: false,
  }).required().messages({
    'string.base': 'Original URL must be a string.',
    'string.empty': 'Original URL cannot be empty.',
    'string.uri': 'Original URL must be a valid URI (e.g., http://example.com or https://example.com).',
    'any.required': 'Original URL is required.',
  }),
  customBackHalf: Joi.string().alphanum().min(3).max(50).optional().allow(null, '').messages({
    'string.base': 'Custom back-half must be a string.',
    'string.alphanum': 'Custom back-half must only contain alphanumeric characters.',
    'string.min': 'Custom back-half must be at least {#limit} characters long.',
    'string.max': 'Custom back-half cannot be more than {#limit} characters long.',
  }),
  // Regex for ISO 8601 Date format: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DD
  expiresAt: Joi.string().isoDate().optional().allow(null).messages({
    'string.base': 'Expiration date must be a string.',
    'string.isoDate': 'Expiration date must be a valid ISO 8601 date (e.g., YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DD).',
  }),
  // userId: Joi.number().integer().positive().optional(), // If user association is implemented
});

// TODO: Add schemas for other operations if needed:
// - updateLinkSchema
// - paramsSchema (for validating URL parameters like :shortCode or :id)

module.exports = {
  createLinkSchema,
};
