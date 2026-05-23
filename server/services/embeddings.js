const OpenAI = require('openai');
const logger = require('../utils/logger');

let openaiClient = null;

function initOpenAI() {
  if (openaiClient) return openaiClient;
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.warn('[Embeddings] OPENAI_API_KEY not configured');
    return null;
  }
  
  try {
    openaiClient = new OpenAI({ apiKey });
    logger.info('[Embeddings] OpenAI client initialized');
    return openaiClient;
  } catch (error) {
    logger.error('[Embeddings] Failed to initialize OpenAI:', error);
    return null;
  }
}

async function createEmbedding(text) {
  const client = initOpenAI();
  if (!client) {
    throw new Error('OpenAI client not initialized');
  }
  
  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536
    });
    
    return response.data[0].embedding;
  } catch (error) {
    logger.error('[Embeddings] Failed to create embedding:', error);
    throw error;
  }
}

async function createBatchEmbeddings(texts) {
  const client = initOpenAI();
  if (!client) {
    throw new Error('OpenAI client not initialized');
  }
  
  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      dimensions: 1536
    });
    
    return response.data.map(item => item.embedding);
  } catch (error) {
    logger.error('[Embeddings] Failed to create batch embeddings:', error);
    throw error;
  }
}

module.exports = {
  initOpenAI,
  createEmbedding,
  createBatchEmbeddings
};
