const express = require('express');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(express.json());

// Twilio credentials from .env
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Dummy endpoint for audio prediction (replace with your actual logic)
app.post('/predict', async (req, res) => {
  // Placeholder for your audio prediction logic
  const predictedClass = 'tiger'; // Simulate a result
  res.json({ predicted_class: predictedClass });
});

// Endpoint to send WhatsApp message
app.post('/send-whatsapp', async (req, res) => {
  const { message, phoneNumbers } = req.body;

  try {
    const promises = phoneNumbers.map((number) =>
      twilioClient.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`, // WhatsApp sender
        to: `whatsapp:${number}`, // WhatsApp recipient
      })
    );
    await Promise.all(promises);
    res.json({ success: true, message: 'WILD ANIMAL DETECTED GET TO THE SAFE PLACE IMMIDEATLY' });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(5002, () => console.log('Server running on port 5002'));