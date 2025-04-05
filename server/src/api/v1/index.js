const express = require('express');

const router = express.Router();

// Status check route
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API v1 is running',
  });
});

module.exports = router;