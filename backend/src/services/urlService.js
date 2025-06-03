const db = require('../config/database');
const { redisClient } = require('../config/redis');
// const Joi = require('joi'); // For URL validation later

const BASE62_CHARSET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Encodes a number to a Base62 string.
 * @param {number} num - The number to encode.
 * @returns {string} The Base62 encoded string.
 */
function toBase62(num) {
  if (num === 0) {
    return BASE62_CHARSET[0];
  }
  let base62 = '';
  while (num > 0) {
    base62 = BASE62_CHARSET[num % 62] + base62;
    num = Math.floor(num / 62);
  }
  return base62;
}

/**
 * Decodes a Base62 string to a number.
 * @param {string} str - The Base62 string to decode.
 * @returns {number} The decoded number.
 */
function fromBase62(str) {
  let num = 0;
  for (let i = 0; i < str.length; i++) {
    num = num * 62 + BASE62_CHARSET.indexOf(str[i]);
  }
  return num;
}

/**
 * Generates a unique short code.
 * For simplicity, this initial version might use a timestamp or a counter.
 * A more robust solution would involve a distributed ID generator (e.g., Snowflake)
 * or a strategy to ensure uniqueness across multiple instances.
 * 
 * This function now uses a database sequence for generating a unique numeric ID,
 * which is then converted to a Base62 string. This approach is much more robust
 * against collisions than random generation.
 */
async function generateUniqueShortCode() {
  try {
    // Get the next value from the sequence
    const { rows } = await db.query("SELECT nextval('link_id_seq') as next_id");
    const nextId = rows[0].next_id;

    // Convert the numeric ID to a Base62 string
    const shortCode = toBase62(Number(nextId));
    
    // Optionally, check for extremely rare collisions if the sequence resets or if there's a manual insert.
    // However, with a sequence, this should be inherently unique.
    // For added safety in a distributed system or if sequence guarantees are complex,
    // a check like the one in the previous version could be added here, but it's often overkill.
    return shortCode;
  } catch (error) {
    console.error('Error generating unique short code from sequence:', error);
    throw new Error('Could not generate unique short code.'); // Or handle more gracefully
  }
}

/**
 * Validates a URL.
 * Basic check for now, can be expanded with Joi or a more comprehensive library.
 * @param {string} url - The URL to validate.
 * @returns {boolean} True if the URL is considered valid, false otherwise.
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  // Simple regex for basic URL format check (http/https)
  // This is a basic check and might not cover all edge cases or internationalized domain names.
  const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(url);
}

/**
 * Checks if a custom back-half is available.
 * @param {string} customBackHalf - The custom back-half to check.
 * @returns {Promise<boolean>} True if available, false otherwise.
 */
async function isCustomBackHalfAvailable(customBackHalf) {
  // TODO: Add validation for customBackHalf format (length, characters)
  // TODO: Add check against a list of reserved words/routes
  if (!customBackHalf || typeof customBackHalf !== 'string' || customBackHalf.length < 3 || customBackHalf.length > 50) {
    // Basic validation, can be expanded
    return false; 
  }
  // Regex for allowed characters (alphanumeric, hyphen, underscore)
  const allowedCharsPattern = /^[a-zA-Z0-9_-]+$/;
  if (!allowedCharsPattern.test(customBackHalf)) {
      return false;
  }

  const { rows } = await db.query('SELECT id FROM links WHERE short_code = $1', [customBackHalf]);
  return rows.length === 0;
}

/**
 * Creates a new short link.
 * @param {string} originalUrl - The original URL to shorten.
 * @param {string} [customBackHalf] - Optional custom back-half for the short link.
 * @param {number} [userId] - Optional ID of the user creating the link.
 * @param {Date} [expiresAt] - Optional expiration date for the link.
 * @returns {Promise<object>} The created link object.
 */
async function createShortLink({ originalUrl, customBackHalf, userId, expiresAt }) {
  if (!isValidUrl(originalUrl)) {
    throw new Error('Invalid original URL format.');
  }

  let shortCode;
  let isCustom = false;

  if (customBackHalf) {
    if (await isCustomBackHalfAvailable(customBackHalf)) {
      shortCode = customBackHalf;
      isCustom = true;
    } else {
      // Option 1: Throw error if custom back-half is taken/invalid
      throw new Error('Custom back-half is not available or invalid.');
      // Option 2: Fallback to generated short code (inform user)
      // shortCode = await generateUniqueShortCode();
      // console.warn(`Custom back-half '${customBackHalf}' not available, generated '${shortCode}' instead.`);
    }
  } else {
    shortCode = await generateUniqueShortCode();
  }

  const query = `
    INSERT INTO links (original_url, short_code, custom_back_half, user_id, expires_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, short_code, original_url, custom_back_half, created_at, expires_at, click_count;
  `;
  const values = [originalUrl, shortCode, isCustom, userId || null, expiresAt || null];

  try {
    const { rows } = await db.query(query, values);
    const newLink = rows[0];

    // Cache the new link in Redis: short_code -> original_url
    // Set an expiration for the cache entry if the link itself expires.
    // For simplicity, cache for a fixed duration or match link's TTL if provided.
    const cacheTTL = expiresAt ? Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000) : 3600 * 24; // 24 hours default
    if (redisClient.isOpen && newLink) {
      await redisClient.set(newLink.short_code, newLink.original_url, {
        EX: cacheTTL > 0 ? cacheTTL : 3600, // Ensure positive TTL, min 1 hour
      });
    }
    return newLink;
  } catch (error) {
    // Handle potential unique constraint violation if, by an extremely rare chance,
    // a generated short_code collides after sequence generation but before insert.
    // Or if a custom_back_half check passed but it was inserted by a concurrent request.
    if (error.code === '23505') { // Unique violation
      console.error('Short code collision during insert:', shortCode, error.detail);
      // Retry logic could be implemented here, or re-throw.
      // If it was a generated code, this is highly unlikely with a sequence.
      // If it was custom, the availability check might have a race condition.
      throw new Error(`Failed to create short link: The code '${shortCode}' is already in use or a collision occurred.`);
    }
    console.error('Error creating short link in database:', error);
    throw new Error('Could not create short link.');
  }
}

// TODO: Implement other service functions:
// - getOriginalUrl(shortCode)
// - updateLink(linkId, newOriginalUrl, userId)
// - deleteLink(linkId, userId)
// - validateUrl(url) // (partially done with isValidUrl)
// - isCustomBackHalfAvailable(customBackHalf) // (done)

/**
 * Retrieves the original URL for a given short code.
 * Implements a cache-first strategy (Redis then PostgreSQL).
 * @param {string} shortCode - The short code to look up.
 * @returns {Promise<string|null>} The original URL, or null if not found or inactive.
 */
async function getOriginalUrl(shortCode) {
  if (!shortCode || typeof shortCode !== 'string') {
    return null; // Or throw new Error('Invalid short code format.');
  }

  try {
    // 1. Try to fetch from Redis cache
    if (redisClient.isOpen) {
      const cachedUrl = await redisClient.get(shortCode);
      if (cachedUrl) {
        console.log(`Cache hit for short_code: ${shortCode}`);
        // Note: Click tracking should ideally happen here or in the controller
        // For now, this service just returns the URL.
        return cachedUrl;
      }
      console.log(`Cache miss for short_code: ${shortCode}`);
    }

    // 2. If not in cache, fetch from database
    const query = `
      SELECT original_url, expires_at, is_active 
      FROM links 
      WHERE short_code = $1;
    `;
    const { rows } = await db.query(query, [shortCode]);

    if (rows.length === 0) {
      return null; // Not found
    }

    const link = rows[0];

    // 3. Check if the link is active and not expired
    if (!link.is_active) {
      console.log(`Link ${shortCode} is inactive.`);
      return null;
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      console.log(`Link ${shortCode} has expired.`);
      // Optionally, update is_active to false in DB
      // await db.query('UPDATE links SET is_active = FALSE WHERE short_code = $1', [shortCode]);
      return null;
    }

    // 4. If found and valid, cache it in Redis for future requests
    if (redisClient.isOpen) {
      const cacheTTL = link.expires_at ? Math.floor((new Date(link.expires_at).getTime() - Date.now()) / 1000) : 3600 * 24; // 24 hours default
      await redisClient.set(shortCode, link.original_url, {
        EX: cacheTTL > 0 ? cacheTTL : 3600, // Ensure positive TTL, min 1 hour
      });
      console.log(`Cached short_code: ${shortCode} after DB fetch.`);
    }

    // Note: Click tracking should ideally happen here or in the controller
    return link.original_url;

  } catch (error) {
    console.error(`Error retrieving original URL for short_code ${shortCode}:`, error);
    // Depending on error handling strategy, might throw or return null
    throw new Error('Could not retrieve original URL.'); 
  }
}

/**
 * Logs a click event for a given short code.
 * This is designed to be called asynchronously to not slow down redirects.
 * @param {string} shortCode - The short code that was clicked.
 * @param {string} ipAddress - The IP address of the clicker.
 * @param {string} userAgent - The user agent of the clicker.
 * @param {string} [referer] - The referer header, if available.
 * @param {string} [countryCode] - The country code (from geo-IP lookup, TBD).
 */
async function logClick({ shortCode, ipAddress, userAgent, referer, countryCode }) {
  try {
    // First, get the link_id for the given short_code
    const linkQuery = 'SELECT id FROM links WHERE short_code = $1';
    const linkResult = await db.query(linkQuery, [shortCode]);

    if (linkResult.rows.length === 0) {
      console.warn(`Attempted to log click for non-existent short_code: ${shortCode}`);
      return; // Link not found, cannot log click
    }
    const linkId = linkResult.rows[0].id;

    // Insert into clicks table. The trigger `after_click_insert` will update `links.click_count`.
    const clickQuery = `
      INSERT INTO clicks (link_id, ip_address, user_agent, referer, country_code)
      VALUES ($1, $2, $3, $4, $5);
    `;
    await db.query(clickQuery, [linkId, ipAddress, userAgent, referer || null, countryCode || null]);
    console.log(`Click logged for short_code: ${shortCode} (link_id: ${linkId})`);

  } catch (error) {
    console.error(`Error logging click for short_code ${shortCode}:`, error);
    // Log and continue, as click logging failure shouldn't break the redirect.
  }
}


module.exports = {
  toBase62,
  fromBase62,
  generateUniqueShortCode,
  createShortLink,
  isValidUrl,
  isCustomBackHalfAvailable,
  getOriginalUrl,
  logClick,
  // ... other functions
};
