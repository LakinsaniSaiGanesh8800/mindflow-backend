const Knowledge = require('../models/Knowledge');

/**
 * Search knowledge entries using MongoDB text search and scoring
 */
async function searchKnowledge(query, limit = 5) {
  try {
    // First try text search
    let results = await Knowledge.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);

    // If text search yields no results, try regex fallback
    if (results.length === 0) {
      const regexQuery = new RegExp(query.split(' ').join('|'), 'i');
      results = await Knowledge.find({
        $or: [
          { title: regexQuery },
          { content: regexQuery },
          { tags: { $in: [regexQuery] } },
          { summary: regexQuery }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit);
    }

    return results;
  } catch (error) {
    console.error('Search error:', error);
    // Fallback to recent entries if search fails
    return await Knowledge.find()
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

/**
 * Calculate relevance score for a knowledge entry
 */
function calculateRelevance(entry, query) {
  const queryLower = query.toLowerCase();
  const titleLower = entry.title.toLowerCase();
  const contentLower = entry.content.toLowerCase();
  const tagsLower = entry.tags.map(t => t.toLowerCase());
  
  let score = 0;
  
  // Title matches are most important
  if (titleLower.includes(queryLower)) score += 10;
  
  // Tag matches are valuable
  tagsLower.forEach(tag => {
    if (tag.includes(queryLower)) score += 5;
  });
  
  // Content matches
  const contentMatches = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
  score += contentMatches;
  
  return score;
}

module.exports = {
  searchKnowledge,
  calculateRelevance
};
