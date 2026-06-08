import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'crypto';
import { PaymentSuccessTemplateData } from '../templates/payment-success.template.js';
import { generateTicketPdfDefinition } from '../templates/ticket.template.js';
import { storageProvider } from '../libs/storage/index.js';
import { logger } from '../libs/logger.js';

const require = createRequire(import.meta.url);
const pdfmake = require('pdfmake');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve paths to fonts inside node_modules/pdfmake/fonts/Roboto
const fontPath = path.join(__dirname, '../../node_modules/pdfmake/fonts/Roboto');

const fonts = {
  Roboto: {
    normal: path.join(fontPath, 'Roboto-Regular.ttf'),
    bold: path.join(fontPath, 'Roboto-Medium.ttf'),
    italics: path.join(fontPath, 'Roboto-Italic.ttf'),
    bolditalics: path.join(fontPath, 'Roboto-MediumItalic.ttf'),
  },
};

pdfmake.setFonts(fonts);

export class PdfService {
  /**
   * Generates a PDF ticket using pdfmake and uploads it to the configured storage.
   *
   * @param data - The template data.
   * @param orderNumber - The unique order reference.
   * @returns The public URL of the uploaded PDF file.
   */
  async generateAndUploadTicketPdf(data: PaymentSuccessTemplateData, orderNumber: string): Promise<string> {
    logger.info({ orderNumber }, 'Starting PDF generation using pdfmake');
    try {
      const docDefinition = generateTicketPdfDefinition(data);

      const pdfDoc = pdfmake.createPdf(docDefinition);
      const pdfBuffer = await pdfDoc.getBuffer();

      logger.info({ orderNumber }, 'PDF generated successfully, uploading to storage...');

      const uniqueId = crypto.randomUUID();
      const filename = `tickets/${orderNumber}-${uniqueId}.pdf`;
      const publicUrl = await storageProvider.upload(pdfBuffer, filename, 'application/pdf');

      logger.info({ orderNumber, publicUrl }, 'PDF ticket processed and uploaded');
      return publicUrl;
    } catch (error) {
      logger.error({ error, orderNumber }, 'Error generating or uploading PDF ticket');
      throw error;
    }
  }
}

export const pdfService = new PdfService();
