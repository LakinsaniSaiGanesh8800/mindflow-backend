const express = require('express');
const router = express.Router();
const Knowledge = require('../models/Knowledge');
const aiService = require('../services/aiService');
const { searchKnowledge } = require('../utils/textSearch');

// Public query endpoint
router.get('/query', async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        error: 'Query parameter "q" is required' 
      });
    }

    console.log('🔍 Public query:', q);

    // Search for relevant knowledge entries
    const relevantEntries = await searchKnowledge(q, 5);
    
    if (relevantEntries.length === 0) {
      return res.json({
        answer: "No relevant information found in the knowledge base.",
        sources: []
      });
    }

    // Format context for AI
    const context = relevantEntries.map(entry => 
      `Title: ${entry.title}\nContent: ${entry.content}\nSummary: ${entry.summary}`
    ).join('\n\n---\n\n');

    // Get AI answer
    const answer = await aiService.askQuestion(context, q);

    // Format sources
    const sources = relevantEntries.map(entry => ({
      id: entry.id,
      title: entry.title
    }));

    res.json({
      answer,
      sources
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
