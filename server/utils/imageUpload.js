/**
 * Image upload pipeline (P9).
 *
 * Workflow:
 * 1. Nhận buffer file
 * 2. Dùng `sharp` để resize + convert WebP (nếu có)
 * 3. Upload lên Cloudinary với transformations (nếu có CLOUDINARY_*)
 * 4. Trả về { thumbnail, medium, original }
 *
 * Tất cả deps optional — nếu chưa cài → return error message clear.
 */

function isCloudinaryConfigured() {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function tryRequire(name) {
  try {
    // eslint-disable-next-line global-require
    return require(name);
  } catch {
    return null;
  }
}

let cloudinaryClient = null;
function getCloudinary() {
  if (cloudinaryClient) return cloudinaryClient;
  if (!isCloudinaryConfigured()) return null;
  const cld = tryRequire('cloudinary');
  if (!cld) return null;
  cld.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  cloudinaryClient = cld.v2;
  return cloudinaryClient;
}

/**
 * Process + upload image.
 * @param {Buffer} buffer
 * @param {{ folder?: string, publicId?: string }} options
 * @returns {Promise<{ thumbnail: string, medium: string, original: string }|{ error: string }>}
 */
async function processAndUpload(buffer, { folder = 'novashop/products', publicId } = {}) {
  const cld = getCloudinary();
  if (!cld) {
    return { error: 'Cloudinary chưa cấu hình (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)' };
  }

  const sharp = tryRequire('sharp');
  let webpBuffer = buffer;
  if (sharp) {
    try {
      webpBuffer = await sharp(buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90 })
        .toBuffer();
    } catch (err) {
      console.warn('[ImageUpload] sharp processing failed:', err.message);
    }
  }

  return new Promise((resolve) => {
    const uploadStream = cld.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        format: 'webp',
        overwrite: true,
        eager: [
          { width: 200, height: 200, crop: 'fill', quality: 80, format: 'webp' },
          { width: 600, height: 600, crop: 'limit', quality: 85, format: 'webp' }
        ]
      },
      (error, result) => {
        if (error) {
          resolve({ error: error.message });
          return;
        }
        const thumbnail = result.eager?.[0]?.secure_url || result.secure_url;
        const medium = result.eager?.[1]?.secure_url || result.secure_url;
        const original = result.secure_url;
        resolve({ thumbnail, medium, original, publicId: result.public_id });
      }
    );
    uploadStream.end(webpBuffer);
  });
}

module.exports = {
  isCloudinaryConfigured,
  processAndUpload
};
