import puppeteer from 'puppeteer';
import crypto from 'crypto';
import { PaymentSuccessTemplateData } from '../templates/payment-success.template.js';
import { renderTicketPdf } from '../templates/ticket.template.js';
import { storageProvider } from '../libs/storage/index.js';
import { logger } from '../libs/logger.js';

export class PdfService {
  /**
   * Generates a PDF ticket using Puppeteer and uploads it to the configured storage.
   */
  async generateAndUploadTicketPdf(data: PaymentSuccessTemplateData, orderNumber: string): Promise<string> {
    logger.info({ orderNumber }, 'Starting PDF generation');
    let browser;
    try {
      const htmlContent = renderTicketPdf(data);

      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      await page.setContent(htmlContent, { waitUntil: 'load' });
      await page.waitForNetworkIdle({ idleTime: 500 }).catch(() => {});

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      });

      logger.info({ orderNumber }, 'PDF generated successfully, uploading to storage...');

      const uniqueId = crypto.randomUUID();
      const filename = `tickets/${orderNumber}-${uniqueId}.pdf`;
      const buffer = Buffer.from(pdfBuffer);
      const publicUrl = await storageProvider.upload(buffer, filename, 'application/pdf');

      logger.info({ orderNumber, publicUrl }, 'PDF ticket processed and uploaded');
      return publicUrl;
    } catch (error) {
      logger.error({ error, orderNumber }, 'Error generating or uploading PDF ticket');
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

export const pdfService = new PdfService();
