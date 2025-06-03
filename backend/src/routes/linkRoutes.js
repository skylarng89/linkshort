const express = require('express');
const linkController = require('../controllers/linkController');
const validateRequest = require('../middleware/validateRequest');
const { createLinkSchema } = require('../validators/linkSchemas');

const apiRouter = express.Router();
const redirectRouter = express.Router();

// --- API Routes (prefixed with /api) ---

// POST /api/links - Create a new short link
apiRouter.post(
  '/links',
  validateRequest(createLinkSchema), // Validate request body against createLinkSchema
  linkController.handleCreateShortLink
);

// TODO: Add other API routes for managing links:
// GET /api/links - List links (requires auth, pagination)
// GET /api/links/:idOrCode - Get details of a specific link
// PUT /api/links/:idOrCode - Update a link
// DELETE /api/links/:idOrCode - Delete a link


// --- Root Level Routes (for redirection) ---

// GET /:shortCode - Redirect to original URL
redirectRouter.get('/:shortCode', linkController.handleRedirect);


module.exports = {
  apiRouter,        // For routes like /api/links
  redirectRouter,   // For routes like /:shortCode
};
