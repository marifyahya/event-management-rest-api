import type { TDocumentDefinitions, Margins } from 'pdfmake/interfaces.js';
import type { PaymentSuccessTemplateData } from './payment-success.template.js';

/**
 * Draws a dashed line as an array of solid lines.
 *
 * @param x - The x-coordinate of the vertical line.
 * @param y1 - The starting y-coordinate.
 * @param y2 - The ending y-coordinate.
 * @param dashLength - The length of each dash.
 * @param spaceLength - The gap between dashes.
 */
function drawDashedLine(x: number, y1: number, y2: number, dashLength = 4, spaceLength = 4) {
  const lines = [];
  let currentY = y1;
  while (currentY < y2) {
    const nextY = Math.min(currentY + dashLength, y2);
    lines.push({
      type: 'line',
      x1: x,
      y1: currentY,
      x2: x,
      y2: nextY,
      lineWidth: 1.5,
      lineColor: '#d1d5db',
    });
    currentY = nextY + spaceLength;
  }
  return lines;
}

/**
 * Generates the pdfmake document definition for the ticket PDF.
 *
 * @param data - The data required to render the ticket.
 */
export function generateTicketPdfDefinition(data: PaymentSuccessTemplateData): TDocumentDefinitions {
  const { eventStartAt, eventTitle, eventLocation, orderNumber, customerName, to, quantity, tickets } = data;

  const dateObj = new Date(eventStartAt);
  // TODO: creaet helper if appears again
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(dateObj);

  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40] as Margins,
    background: {
      canvas: [
        {
          type: 'rect',
          x: 0,
          y: 0,
          w: 595.28,
          h: 841.89,
          color: '#f4f6f9',
        },
      ],
    },
    content: [
      // Top Header
      {
        columns: [
          { text: '🎟️  TICKETS.LIVE', fontSize: 18, bold: true, color: '#251b95' },
          {
            text: [
              { text: quantity.toString(), bold: true },
              { text: ' Tickets Found', color: '#4b5563' },
            ],
            fontSize: 12,
            alignment: 'right',
            margin: [0, 4, 0, 0] as Margins,
          },
        ],
        margin: [0, 0, 0, 16] as Margins,
      },
      // Main Event Details Card
      {
        table: {
          widths: ['*'],
          body: [
            // Row 1: Hero Banner
            [
              {
                stack: [
                  { text: 'OFFICIAL EVENT DETAILS', fontSize: 9, bold: true, color: '#a5b4fc', characterSpacing: 1 },
                  { text: eventTitle, fontSize: 22, bold: true, color: '#ffffff', margin: [0, 6, 0, 0] as Margins },
                ] as any[],
                margin: [24, 20, 24, 20] as Margins,
              },
            ],
            // Row 2: Event Details Grid
            [
              {
                columns: [
                  {
                    stack: [
                      { text: 'TANGGAL', fontSize: 9, bold: true, color: '#6b7280', characterSpacing: 0.5 },
                      {
                        text: `📅  ${formattedDate}`,
                        fontSize: 12,
                        bold: true,
                        color: '#111827',
                        margin: [0, 4, 0, 0] as Margins,
                      },
                    ] as any[],
                  },
                  {
                    stack: [
                      { text: 'LOKASI', fontSize: 9, bold: true, color: '#6b7280', characterSpacing: 0.5 },
                      {
                        text: `📍  ${eventLocation}`,
                        fontSize: 12,
                        bold: true,
                        color: '#111827',
                        margin: [0, 4, 0, 0] as Margins,
                      },
                    ] as any[],
                  },
                ],
                margin: [24, 14, 24, 14] as Margins,
              },
            ],
            // Row 3: Order Meta
            [
              {
                columns: [
                  {
                    stack: [
                      { text: 'ORDER ID', fontSize: 9, bold: true, color: '#6b7280', characterSpacing: 0.5 },
                      {
                        text: orderNumber,
                        fontSize: 11,
                        bold: true,
                        color: '#111827',
                        margin: [0, 4, 0, 0] as Margins,
                      },
                    ] as any[],
                  },
                  {
                    stack: [
                      {
                        text: 'PURCHASED BY',
                        fontSize: 9,
                        bold: true,
                        color: '#6b7280',
                        characterSpacing: 0.5,
                        alignment: 'right',
                      },
                      {
                        text: `${customerName} (${to})`,
                        fontSize: 11,
                        bold: true,
                        color: '#111827',
                        alignment: 'right',
                        margin: [0, 4, 0, 0] as Margins,
                      },
                    ] as any[],
                  },
                ],
                margin: [24, 12, 24, 12] as Margins,
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          fillColor: (rowIndex: number) => {
            if (rowIndex === 0) return '#31239f';
            if (rowIndex === 1) return '#ffffff';
            return '#f9fafb';
          },
        },
        margin: [0, 0, 0, 24] as Margins,
      },
      // Individual Ticket List
      ...tickets.map((ticket) => ({
        table: {
          widths: [130, 20, '*'],
          body: [
            [
              // Col 1: QR Section
              {
                stack: [
                  { qr: ticket.qrToken, fit: 80, alignment: 'center' },
                  {
                    text: 'SCAN TICKET',
                    fontSize: 9,
                    bold: true,
                    color: '#6b7280',
                    alignment: 'center',
                    margin: [0, 6, 0, 0] as Margins,
                  },
                ] as any[],
                margin: [14, 14, 14, 14] as Margins,
                fillColor: '#f9fafb',
              },
              // Col 2: Perforation
              {
                stack: [
                  {
                    canvas: drawDashedLine(10, 0, 80, 4, 4),
                    alignment: 'center',
                  },
                ] as any[],
                margin: [0, 10, 0, 10] as Margins,
                fillColor: '#ffffff',
              },
              // Col 3: Info Section
              {
                stack: [
                  { text: 'TICKET CODE', fontSize: 9, bold: true, color: '#6b7280' },
                  {
                    text: ticket.ticketCode,
                    fontSize: 20,
                    bold: true,
                    color: '#251b95',
                    margin: [0, 4, 0, 8] as Margins,
                  },
                  { text: 'GENERAL ADMISSION', fontSize: 11, bold: true, color: '#4b5563' },
                ] as any[],
                margin: [18, 18, 18, 18] as Margins,
                fillColor: '#ffffff',
              },
            ],
          ] as any[][],
        },
        layout: {
          hLineWidth: (i: number) => (i === 0 || i === 1 ? 1 : 0),
          vLineWidth: (i: number) => (i === 0 || i === 3 ? 1 : 0),
          hLineColor: () => '#e5e7eb',
          vLineColor: () => '#e5e7eb',
        },
        margin: [0, 0, 0, 16] as Margins,
        unbreakable: true,
      })),
    ],
  };
}
