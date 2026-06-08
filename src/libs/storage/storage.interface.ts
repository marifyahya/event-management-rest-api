export interface StorageProvider {
  /**
   * Uploads a file buffer and returns the public URL
   * @param buffer The file buffer
   * @param filename The destination filename (e.g., 'tickets/TKT-123.pdf')
   * @param contentType The MIME type (default: application/pdf)
   * @returns publicUrl
   */
  upload(buffer: Buffer, filename: string, contentType?: string): Promise<string>;
}
