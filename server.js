const express = require('express');
const bodyParser = require('body-parser');
const midtransClient = require('midtrans-client');

const app = express();
app.use(bodyParser.json());

// 🔑 pakai Server Key dari Midtrans Sandbox
let snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: 'Mid-server-O3QrW-7ylAID5BwdJkaF98bt'
});

app.post('/create-transaction', async (req, res) => {
    let parameter = {
        transaction_details: {
            order_id: "order-id-" + Math.round((new Date()).getTime() / 1000),
            gross_amount: 10000
        },
        customer_details: {
            first_name: "Budi",
            email: "budi@example.com",
            phone: "081234567890"
        }
    };

    try {
        let transaction = await snap.createTransaction(parameter);
        res.json({ token: transaction.token });
    } catch (err) {
        res.status(500).json(err);
    }
});

app.listen(5000, () => {
    console.log("✅ Server running on http://localhost:5000");
});
