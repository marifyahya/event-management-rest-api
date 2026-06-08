import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type PaymentSuccessTemplateData = {
  to: string;
  customerName: string;
  orderNumber: string;
  eventTitle: string;
  eventLocation: string;
  eventStartAt: Date | string;
  quantity: number;
  totalAmount: number;
  tickets: Array<{ ticketCode: string; qrToken: string }>;
  pdfUrl?: string;
};

// Register helper for 1-based index in Handlebars loops
Handlebars.registerHelper('@index_plus_one', (options) => {
  return options.data.index + 1;
});

// Compile template once during module initialization (synchronous read is OK here)
const templatePath = path.join(__dirname, 'email', 'payment-success.hbs');
const templateSource = fs.readFileSync(templatePath, 'utf-8');
const compiledTemplate = Handlebars.compile(templateSource);

/**
 * Render payment success email HTML using Handlebars.
 */
export function renderPaymentSuccessEmail(data: PaymentSuccessTemplateData): string {
  const { eventStartAt, totalAmount, ...rest } = data;

  const dateObj = new Date(eventStartAt);
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(dateObj);

  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(totalAmount);

  return compiledTemplate({
    ...rest,
    formattedDate,
    formattedAmount,
  });
}
