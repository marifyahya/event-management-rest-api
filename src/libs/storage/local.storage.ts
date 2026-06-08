import fs from 'fs';
import path from 'path';
import type { StorageProvider } from './storage.interface.js';
import { env } from '../../config/env.js';
import { logger } from '../logger.js';

export class LocalStorage implements StorageProvider {
  async upload(buffer: Buffer, filename: string, contentType: string = 'application/pdf'): Promise<string> {
    try {
      // Map 'tickets/TKT-123.pdf' -> './public/tickets/TKT-123.pdf'
      const publicPath = path.join(process.cwd(), 'public');
      const targetPath = path.join(publicPath, filename);
      const targetDir = path.dirname(targetPath);

      // Ensure directory exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(targetPath, buffer);

      // Generate public URL
      const publicUrl = `${env.appUrl}/public/${filename}`;

      logger.info({ publicUrl }, 'File uploaded to LocalStorage');
      return publicUrl;
    } catch (error) {
      logger.error({ error, filename }, 'Failed to upload to LocalStorage');
      throw error;
    }
  }
}
