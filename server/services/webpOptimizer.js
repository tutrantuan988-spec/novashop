const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * WebP Image Optimization Service
 *
 * Converts images to WebP format for better compression and faster loading.
 * Uses sharp library for efficient image processing.
 *
 * Usage:
 *   const webp = require('./webpOptimizer');
 *
 *   // In Express route:
 *   app.get('/api/images/optimize', async (req, res) => {
 *     const { url, width, quality } = req.query;
 *     const webpBuffer = await webp.optimizeFromUrl(url, { width: parseInt(width), quality: parseInt(quality) });
 *     res.set('Content-Type', 'image/webp');
 *     res.set('Cache-Control', 'public, max-age=31536000');
 *     res.send(webpBuffer);
 *   });
 */

const CACHE_DIR = path.join(__dirname, '../../.webp-cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Optimize an image buffer to WebP
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options
 * @param {number} options.width - Resize width (maintains aspect ratio)
 * @param {number} options.quality - WebP quality (1-100, default 80)
 * @returns {Promise<Buffer>} WebP buffer
 */
async function optimizeBuffer(buffer, options = {}) {
  const { width, quality = 80 } = options;

  let pipeline = sharp(buffer);

  if (width) {
    pipeline = pipeline.resize(width, null, { withoutEnlargement: true });
  }

  return pipeline
    .webp({ quality, effort: 6 })
    .toBuffer();
}

/**
 * Optimize an image from URL to WebP
 * @param {string} url - Image URL
 * @param {Object} options
 * @param {number} options.width - Resize width
 * @param {number} options.quality - WebP quality
 * @returns {Promise<Buffer>} WebP buffer
 */
async function optimizeFromUrl(url, options = {}) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return optimizeBuffer(Buffer.from(buffer), options);
}

/**
 * Optimize a local file to WebP
 * @param {string} filePath - Local file path
 * @param {Object} options
 * @param {number} options.width - Resize width
 * @param {number} options.quality - WebP quality
 * @param {string} options.outputPath - Output file path (optional)
 * @returns {Promise<Buffer>} WebP buffer
 */
async function optimizeFile(filePath, options = {}) {
  const { outputPath } = options;
  const buffer = fs.readFileSync(filePath);
  const webpBuffer = await optimizeBuffer(buffer, options);

  if (outputPath) {
    fs.writeFileSync(outputPath, webpBuffer);
  }

  return webpBuffer;
}

/**
 * Get cached WebP image or generate new one
 * @param {string} sourceUrl - Original image URL
 * @param {Object} options
 * @returns {Promise<Buffer>}
 */
async function getCachedOrGenerate(sourceUrl, options = {}) {
  const { width = 800, quality = 80 } = options;

  // Generate cache key from URL and options
  const cacheKey = Buffer.from(`${sourceUrl}_${width}_${quality}`).toString('base64url');
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.webp`);

  // Return cached if exists
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath);
  }

  // Generate new
  const webpBuffer = await optimizeFromUrl(sourceUrl, { width, quality });
  fs.writeFileSync(cachePath, webpBuffer);
  return webpBuffer;
}

/**
 * Clean the WebP cache
 */
function cleanCache() {
  if (fs.existsSync(CACHE_DIR)) {
    fs.rmSync(CACHE_DIR, { recursive: true, force: true });
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Get cache size in bytes
 * @returns {number}
 */
function getCacheSize() {
  if (!fs.existsSync(CACHE_DIR)) return 0;
  let size = 0;
  for (const file of fs.readdirSync(CACHE_DIR)) {
    const filePath = path.join(CACHE_DIR, file);
    size += fs.statSync(filePath).size;
  }
  return size;
}

module.exports = {
  optimizeBuffer,
  optimizeFromUrl,
  optimizeFile,
  getCachedOrGenerate,
  cleanCache,
  getCacheSize,
  CACHE_DIR
};
