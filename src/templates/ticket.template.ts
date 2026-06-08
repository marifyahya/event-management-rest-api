import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import type { PaymentSuccessTemplateData } from './payment-success.template.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Compile template once during module initialization
const templatePath = path.join(__dirname, 'pdf', 'ticket.hbs');
const templateSource = fs.readFileSync(templatePath, 'utf-8');
const compiledTemplate = Handlebars.compile(templateSource);

/**
 * Render PDF ticket HTML using Handlebars.
 */
export function renderTicketPdf(data: PaymentSuccessTemplateData): string {
  const { eventStartAt, totalAmount, ...rest } = data;

  const dateObj = new Date(eventStartAt);
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(dateObj);

  return compiledTemplate({
    ...rest,
    formattedDate,
  });
}
