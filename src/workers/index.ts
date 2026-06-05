/**
 * Worker entry point — starts all BullMQ workers in a single process.
 *
 * Run with: npm run workers
 */
import './create-payment.worker.js';
import './order-expire.worker.js';
import './send-email.worker.js';
