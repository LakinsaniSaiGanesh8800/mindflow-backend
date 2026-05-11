const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const brainController = require('../controllers/brainController');

// Capture new knowledge
router.post('/capture', authMiddleware, brainController.capture);

// Query knowledge base
router.post('/query', authMiddleware, brainController.query);

// Delete knowledge entry
router.delete('/:id', authMiddleware, brainController.deleteEntry);

// Get all entries for logged-in user
router.get('/', authMiddleware, brainController.getAllEntries);

module.exports = router;
