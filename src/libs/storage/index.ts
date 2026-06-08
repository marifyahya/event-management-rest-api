import { env } from '../../config/env.js';
import { StorageProvider } from './storage.interface.js';
import { LocalStorage } from './local.storage.js';
import { SupabaseStorage } from './supabase.storage.js';
import { logger } from '../logger.js';

let storageProvider: StorageProvider;

if (env.storageDriver === 'supabase') {
  logger.info('Initializing Supabase Storage Provider');
  storageProvider = new SupabaseStorage();
} else {
  logger.info('Initializing Local Storage Provider');
  storageProvider = new LocalStorage();
}

export { storageProvider };
export type { StorageProvider };
