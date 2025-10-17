// routes/email.js
const express = require('express');
const router = express.Router();

router.get('/logs', (req, res) => {
  res.json({
    emails: [
      {
        _id: '1',
        type: 'vote_confirmation',
        subject: '✅ Vote Confirmation',
        status: 'sent',
        sentAt: new Date(),
        userId: { name: 'Test User' }
      }
    ]
  });
});

router.post('/send', (req, res) => {
  console.log('Sending email:', req.body);
  res.json({
    message: 'Email sent successfully!',
    email: {
      _id: Date.now().toString(),
      ...req.body,
      status: 'sent',
      sentAt: new Date()
    }
  });
});

module.exports = router;