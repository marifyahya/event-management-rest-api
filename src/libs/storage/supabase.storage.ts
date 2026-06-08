import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { StorageProvider } from './storage.interface.js';
import { env } from '../../config/env.js';
import { logger } from '../logger.js';

export class SupabaseStorage implements StorageProvider {
  private client: SupabaseClient;

  constructor() {
    if (!env.supabaseUrl || !env.supabaseKey) {
      throw new Error('Supabase URL and Key must be provided in the environment variables');
    }
    // Initialize Supabase Client (Service Role Key recommended to bypass RLS for uploads)
    this.client = createClient(env.supabaseUrl, env.supabaseKey);
  }

  async upload(buffer: Buffer, filename: string, contentType: string = 'application/pdf'): Promise<string> {
    try {
      const { data, error } = await this.client.storage.from(env.supabaseBucket).upload(filename, buffer, {
        contentType,
        upsert: true,
      });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = this.client.storage.from(env.supabaseBucket).getPublicUrl(filename);

      logger.info({ publicUrl: publicUrlData.publicUrl }, 'File uploaded to SupabaseStorage');

      return publicUrlData.publicUrl;
    } catch (error) {
      logger.error({ error, filename }, 'Failed to upload to SupabaseStorage');
      throw error;
    }
  }
}
