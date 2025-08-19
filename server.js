// index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const midtransClient = require('midtrans-client');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// ===== CONFIG =====
// Prefer environment variable. For quick local testing you can set default here.
// PRODUCTION: set env var MIDTRANS_SERVER_KEY on Railway / hosting platform.
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'Mid-server-O3QrW-7ylAID5BwdJkaF98bt';

// init snap (sandbox)
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: MIDTRANS_SERVER_KEY
});

// in-memory status store (for demo only). For production use DB.
const statusStore = new Map();

// Health
app.get('/', (req, res) => res.send('✅ Midtrans Server OK'));

// Create transaction: expects JSON { "amount": 50000 } (ID generated server-side)
// Returns { order_id, token, redirect_url }
app.post('/create-transaction', async (req, res) => {
  try {
    const amount = Number(req.body?.amount) || 10000;
    const orderId = req.body?.order_id || `order-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: {
        first_name: req.body?.first_name || 'User',
        email: req.body?.email || 'user@example.com',
        phone: req.body?.phone || '081234567890'
      }
      // add item_details or enabled_payments if needed
    };

    const trx = await snap.createTransaction(parameter);
    // store initial status
    statusStore.set(orderId, 'created');

    return res.json({ order_id: orderId, token: trx.token, redirect_url: trx.redirect_url });
  } catch (err) {
    console.error('create-transaction error', err);
    return res.status(500).json({ error: 'failed_create', detail: err.message });
  }
});

// Webhook endpoint for Midtrans HTTP Notification
app.post('/webhook', (req, res) => {
  try {
    const body = req.body;
    // Validate signature_key if exists (Midtrans sends signature_key)
    const signatureKey = body.signature_key;
    if (signatureKey && body.order_id && body.status_code && body.gross_amount) {
      const raw = `${body.order_id}${body.status_code}${body.gross_amount}${MIDTRANS_SERVER_KEY}`;
      const digest = crypto.createHash('sha512').update(raw).digest('hex');
      if (digest !== signatureKey) {
        console.warn('Invalid signature_key');
        return res.status(403).json({ ok: false, message: 'invalid signature' });
      }
    }

    // Save transaction_status e.g. "settlement","pending","expire"
    if (body.order_id && body.transaction_status) {
      statusStore.set(body.order_id, body.transaction_status);
      console.log('Webhook saved:', body.order_id, body.transaction_status);
    } else {
      console.log('Webhook received (no order/status):', body);
    }

    // Reply 200 OK
    return res.json({ ok: true });
  } catch (e) {
    console.error('webhook error', e);
    return res.status(500).json({ ok: false });
  }
});

// Status endpoint: Android can poll to read status
app.get('/status/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  const status = statusStore.get(orderId) || 'unknown';
  res.json({ order_id: orderId, status });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
