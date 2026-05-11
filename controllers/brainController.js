const Joi = require('joi');
const Knowledge = require('../models/Knowledge');
const aiService = require('../services/aiService');
const { searchKnowledge } = require('../utils/textSearch');

// Validation schemas
const captureSchema = Joi.object({
  title: Joi.string().required().max(200),
  content: Joi.string().required(),
  type: Joi.string().valid('note', 'link', 'insight').required(),
  tags: Joi.array().items(Joi.string()).optional(),
  sourceUrl: Joi.string().uri().allow('', null).optional()
});

const querySchema = Joi.object({
  question: Joi.string().required().max(500)
});

// Capture new knowledge entry
exports.capture = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = captureSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details[0].message 
      });
    }

    const { title, content, type, tags, sourceUrl } = value;

    // Generate AI enrichments
    console.log('📤 Generating AI enrichments...');
    const aiEnrichment = await aiService.generateSummaryAndTags(title, content);

    // Merge AI-generated tags with user-provided tags
    const finalTags = [...new Set([...(tags || []), ...aiEnrichment.tags])];

    // Create knowledge entry
    const knowledge = new Knowledge({
     userId: req.user._id,   // ⭐ ADD THIS
     title,
  content,
  type,
  tags: finalTags,
  summary: aiEnrichment.summary,
  sourceUrl
});

    // Save to database
    const savedEntry = await knowledge.save();
    console.log('✅ Knowledge entry saved:', savedEntry.id);

    // Return formatted response
    res.status(201).json({
      id: savedEntry.id,
      title: savedEntry.title,
      summary: savedEntry.summary,
      tags: savedEntry.tags,
      type: savedEntry.type,
      createdAt: savedEntry.createdAt
    });

  } catch (error) {
    next(error);
  }
};

// Query knowledge base with AI
exports.query = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = querySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details[0].message 
      });
    }

    const { question } = value;
    console.log('🔍 Processing query:', question);

    // Search for relevant knowledge entries
    const relevantEntries = await searchKnowledge(question, 5);
    
    if (relevantEntries.length === 0) {
      return res.json({
        answer: "I couldn't find any relevant information in your knowledge base to answer this question.",
        sources: []
      });
    }

    // Format context for AI
    const context = relevantEntries.map(entry => 
      `Title: ${entry.title}\nContent: ${entry.content}\nSummary: ${entry.summary}`
    ).join('\n\n---\n\n');

    // Get AI answer
    const answer = await aiService.askQuestion(context, question);

    // Format sources
    const sources = relevantEntries.map(entry => ({
      id: entry.id,
      title: entry.title,
      type: entry.type,
      summary: entry.summary
    }));

    res.json({
      answer,
      sources
    });

  } catch (error) {
    next(error);
  }
};

// Delete knowledge entry
exports.deleteEntry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedEntry = await Knowledge.findByIdAndDelete(id);
    
    if (!deletedEntry) {
      return res.status(404).json({ 
        error: 'Knowledge entry not found' 
      });
    }

    console.log('🗑️ Deleted knowledge entry:', id);
    res.json({ 
      message: 'Knowledge entry deleted successfully',
      id: deletedEntry.id
    });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    next(error);
  }
};

// Get all knowledge entries (optional endpoint)
exports.getAllEntries = async (req, res, next) => {
  try {
    const { type, tags, limit = 50, offset = 0 } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (tags) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };

    const entries = await Knowledge.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Knowledge.countDocuments(query);

    res.json({
      data: entries,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    next(error);
  }
};
