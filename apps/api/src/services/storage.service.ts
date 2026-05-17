import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class StorageService {
  async uploadImage(file: Buffer, folder: string = 'products'): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        }
      );

      const readable = new Readable();
      readable.push(file);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  async uploadMultipleImages(files: Buffer[], folder: string = 'products'): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  async deleteMultipleImages(publicIds: string[]): Promise<void> {
    await cloudinary.api.delete_resources(publicIds);
  }

  async getImageInfo(publicId: string) {
    return cloudinary.api.resource(publicId);
  }

  getPublicIdFromUrl(url: string): string {
    // Extract public ID from Cloudinary URL
    const match = url.match(/\/v\d+\/(.+)\.\w+$/);
    return match ? match[1] : '';
  }
}

export const storageService = new StorageService();
