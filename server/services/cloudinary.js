/**
 * Cloudinary Media Service
 * 
 * Production-ready image upload and management using Cloudinary.
 * Handles: upload file buffers, delete by public_id, batch delete via Sequelize cascade.
 * 
 * All Cloudinary deps are in the main package.json already.
 */

const path = require('path');

function isConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

let cloudinaryClient = null;

function getClient() {
  if (cloudinaryClient) return cloudinaryClient;
  if (!isConfigured()) return null;
  try {
    const cloudinary = require('cloudinary');
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    cloudinaryClient = cloudinary.v2;
    return cloudinaryClient;
  } catch (err) {
    console.error('[Cloudinary] Failed to initialize:', err.message);
    return null;
  }
}

/**
 * Upload a single image buffer to Cloudinary.
 * @param {Buffer} buffer - Image file buffer
 * @param {object} options
 * @param {string} [options.folder='novashop/products'] - Cloudinary folder
 * @param {string} [options.publicId] - Optional custom public_id
 * @returns {Promise<{url: string, public_id: string, error?: string}>}
 */
async function uploadImage(buffer, { folder = 'novashop/products', publicId } = {}) {
  const cld = getClient();
  if (!cld) {
    return { error: 'Cloudinary chưa cấu hình (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)' };
  }

  return new Promise((resolve) => {
    const uploadStream = cld.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        eager: [
          { width: 200, height: 200, crop: 'fill', quality: 80, format: 'auto' },
          { width: 600, height: 600, crop: 'limit', quality: 85, format: 'auto' },
        ],
        eager_async: false,
      },
      (error, result) => {
        if (error) {
          resolve({ error: error.message });
          return;
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          thumbnail_url: result.eager?.[0]?.secure_url || result.secure_url,
          medium_url: result.eager?.[1]?.secure_url || result.secure_url,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by public_id.
 * @param {string} publicId - The Cloudinary public_id
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function deleteImage(publicId) {
  const cld = getClient();
  if (!cld) return { ok: false, error: 'Cloudinary not configured' };
  if (!publicId) return { ok: false, error: 'public_id is required' };

  try {
    const result = await cld.uploader.destroy(publicId);
    return { ok: result.result === 'ok' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Delete multiple images from Cloudinary by public_ids.
 * @param {string[]} publicIds - Array of Cloudinary public_ids
 * @returns {Promise<{ok: boolean, deleted: number, errors: string[]}>}
 */
async function deleteImages(publicIds) {
  const cld = getClient();
  if (!cld) return { ok: false, deleted: 0, errors: ['Cloudinary not configured'] };
  if (!publicIds || publicIds.length === 0) return { ok: true, deleted: 0, errors: [] };

  try {
    const result = await cld.api.delete_resources(publicIds, {
      keep_original: false,
    });
    const deleted = Object.values(result.deleted || {}).filter(v => v === 'deleted').length;
    return { ok: true, deleted };
  } catch (err) {
    return { ok: false, deleted: 0, errors: [err.message] };
  }
}

/**
 * Extract public_id from a full Cloudinary URL.
 * @param {string} url - Full Cloudinary URL
 * @returns {string|null}
 */
function extractPublicId(url) {
  if (!url) return null;
  // Cloudinary URL format: https://res.cloudinary.com/cloud_name/image/upload/v123456/folder/public_id.webp
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|jpeg|png|webp|gif|avif)$/);
  if (match) return match[1];
  // If no extension match, try simpler extraction
  const parts = url.split('/');
  const last = parts[parts.length - 1];
  const publicId = last.replace(/\.(jpg|jpeg|png|webp|gif|avif)$/i, '');
  if (publicId && publicId !== last) return publicId;
  return null;
}

module.exports = {
  isConfigured,
  uploadImage,
  deleteImage,
  deleteImages,
  extractPublicId,
};
