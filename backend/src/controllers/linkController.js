const urlService = require('../services/urlService');
// const Joi = require('joi'); // For input validation later

// --- Request Handlers ---

/**
 * Handles the creation of a new short link.
 * Expected request body: { originalUrl: string, customBackHalf?: string, expiresAt?: string (ISO Date) }
 * Responds with the created link object or an error.
 */
async function handleCreateShortLink(req, res, next) {
  try {
    const { originalUrl, customBackHalf, expiresAt } = req.body;
    // const userId = req.user?.id; // Assuming user authentication middleware adds req.user

    // TODO: Add Joi validation for request body
    if (!originalUrl) {
      return res.status(400).json({ status: 'error', message: 'originalUrl is required.' });
    }

    const linkData = {
      originalUrl,
      customBackHalf,
      // userId, // Uncomment when user auth is in place
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    };

    const newLink = await urlService.createShortLink(linkData);
    
    // Construct the full short URL to return to the client
    const fullShortUrl = `${process.env.BASE_URL || req.protocol + '://' + req.get('host')}/${newLink.short_code}`;
    
    res.status(201).json({
      status: 'success',
      message: 'Short link created successfully.',
      data: {
        ...newLink,
        short_url: fullShortUrl, // Add the full short URL for convenience
      },
    });
  } catch (error) {
    // Pass error to the centralized error handler
    // Differentiate between client errors (e.g., invalid input, custom back-half taken) and server errors
    if (error.message.includes('Invalid original URL') || error.message.includes('Custom back-half is not available')) {
        error.status = 400; // Bad Request
    } else if (error.message.includes('The code') && error.message.includes('is already in use')) {
        error.status = 409; // Conflict
    }
    next(error);
  }
}

/**
 * Handles redirecting a short code to its original URL.
 * It also logs the click event.
 */
async function handleRedirect(req, res, next) {
  try {
    const { shortCode } = req.params;

    if (!shortCode) {
      // This case might not be hit if the route is specific like /:shortCode
      return res.status(400).json({ status: 'error', message: 'Short code is required.' });
    }

    const originalUrl = await urlService.getOriginalUrl(shortCode);

    if (originalUrl) {
      // Asynchronously log the click event. We don't await this promise
      // because the redirect should happen as fast as possible.
      // Error handling within logClick will prevent it from crashing the app.
      urlService.logClick({
        shortCode,
        ipAddress: req.ip, // Express provides req.ip
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
        // countryCode: // TODO: Implement GeoIP lookup for country code
      }).catch(err => {
        // Even though logClick handles its own errors,
        // good to log if the promise itself rejects unexpectedly.
        console.error('Error when trying to asynchronously log click:', err);
      });
      
      // Perform the redirect
      return res.redirect(301, originalUrl); // 301 for permanent redirect
    } else {
      // If originalUrl is null, it means not found, inactive, or expired
      return res.status(404).json({ status: 'error', message: 'Short link not found, expired, or inactive.' });
    }
  } catch (error) {
    // Pass error to the centralized error handler
    next(error);
  }
}

// TODO: Implement other handlers:
// - handleGetLinkDetails(req, res, next)
// - handleUpdateLink(req, res, next)
// - handleDeleteLink(req, res, next)
// - handleListUserLinks(req, res, next)

module.exports = {
  handleCreateShortLink,
  handleRedirect,
  // ... other handlers
};
