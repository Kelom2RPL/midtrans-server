// index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const midtransClient = require('midtrans-client');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// 🔑 Server Key Midtrans
let snap = new midtransClient.Snap({
  isProduction: false, // false = sandbox
  serverKey: "Mid-server-O3QrW-7ylAID5BwdJkaF98bt"
});

// Route tes server
app.get("/", (req, res) => {
  res.send("✅ Midtrans Server Running on Railway!");
});

// Endpoint untuk bikin transaksi
app.post("/create-transaction", async (req, res) => {
  try {
    let parameter = {
      transaction_details: {
        order_id: "order-id-" + Math.round(new Date().getTime() / 1000),
        gross_amount: 10000 // Rp 10.000
      },
      credit_card: {
        secure: true
      },
      customer_details: {
        first_name: "Budi",
        email: "budi@example.com",
        phone: "081234567890"
      }
    };

    let transaction = await snap.createTransaction(parameter);
    res.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal membuat transaksi", error: err });
  }
});

// ✅ Railway akan otomatis pakai PORT dari environment
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
