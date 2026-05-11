const Groq = require("groq-sdk");

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

class AIService {
  /**
   * Generate summary and tags for content
   */
  async generateSummaryAndTags(title, content) {
    try {
      const prompt = `
        Analyze the following knowledge entry and provide:
        1. A concise summary (max 150 words)
        2. 3-5 relevant tags (lowercase, single words or short phrases)

        Title: ${title}
        Content: ${content}

        Respond in JSON format:
        {
          "summary": "...",
          "tags": ["tag1", "tag2"]
        }
      `;

      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that analyzes content and generates summaries and tags. Always respond in valid JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const text = response.choices[0].message.content;

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { summary: text, tags: [] };
      }

      return {
        summary: result.summary || "No summary available",
        tags: Array.isArray(result.tags) ? result.tags.slice(0, 5) : [],
      };
    } catch (error) {
      console.error("AI Service Error:", error);

      return {
        summary: `Summary of: ${title}`,
        tags: [],
      };
    }
  }

  /**
   * Answer a question based on context
   */
  async askQuestion(context, question) {
    try {
      const prompt = `
        Based on the following knowledge entries from a personal knowledge base, 
        answer the question thoroughly but concisely.

        Context:
        ${context}

        Question: ${question}

        Provide a helpful answer based on the context. If the context doesn't contain 
        enough information, acknowledge this and provide the best answer possible.
      `;

      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful knowledge assistant. Answer questions based on the provided context. Be accurate and cite information from the context when relevant.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("AI Service Error:", error);
      return "I encountered an error while processing your question. Please try again later.";
    }
  }
}

module.exports = new AIService();