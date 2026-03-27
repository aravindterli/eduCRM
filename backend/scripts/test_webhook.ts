import axios from 'axios';
import crypto from 'crypto';

const API_URL = 'http://localhost:5000/api/v1/finance/webhook';
const WEBHOOK_SECRET = process.argv[2] || 'your_webhook_secret_here';
const FEE_ID = process.argv[3];

async function simulateWebhook() {
  if (!FEE_ID) {
    console.error('❌ Please provide a Fee ID.');
    console.log('Usage: npx ts-node .\scripts\test_webhook.ts <SECRET> <FEE_ID>');
    return;
  }

  const payload = {
    event: 'payment_link.paid',
    payload: {
      payment_link: {
        entity: {
          id: 'plink_test_123',
          reference_id: `F_${FEE_ID}`,
          amount_paid: 100000, // 1000 INR
          payment_id: 'pay_test_txn_999'
        }
      }
    }
  };

  const body = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  console.log('⏳ Sending simulated Razorpay Webhook to:', API_URL);
  console.log('📦 Reference ID:', `F_${FEE_ID}`);
  
  try {
    const response = await axios.post(API_URL, payload, {
      headers: {
        'x-razorpay-signature': signature,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Webhook Server Responded:', response.data);
    console.log('📈 Check your Finance Dashboard. The fee should now be marked as COMPLETED.');
  } catch (error: any) {
    console.error('❌ Webhook Failed:', error.response?.data || error.message);
    if (error.response?.status === 400) {
        console.log('💡 TIP: Make sure the SECRET in .env matches the one you provided to this script!');
    }
  }
}

simulateWebhook();
