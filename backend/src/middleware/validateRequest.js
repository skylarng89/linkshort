const Joi = require('joi');

/**
 * Middleware to validate request data (body, params, query) against a Joi schema.
 * @param {Joi.Schema} schema - The Joi schema to validate against.
 * @param {string} property - The property of the request object to validate ('body', 'params', 'query'). Defaults to 'body'.
 */
const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors, not just the first one
      allowUnknown: false, // Disallow properties not defined in the schema
      stripUnknown: true, // Remove unknown properties (can be true or an object for specific stripping)
    });

    if (error) {
      // Joi validation errors have a specific structure.
      // We can pass this error to our centralized error handler,
      // which is set up to format Joi errors nicely.
      // Add a flag to identify it as a Joi error for the handler.
      error.isJoi = true; 
      error.status = 400; // Bad Request
      return next(error);
    }

    // If validation is successful, replace req[property] with the validated (and possibly transformed) value.
    // This is useful for type coercion, default values, etc., defined in the schema.
    req[property] = value;
    next();
  };
};

module.exports = validateRequest;
