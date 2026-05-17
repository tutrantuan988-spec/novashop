const { Pinecone } = require('@pinecone-database/pinecone');
const logger = require('../utils/logger');

let pineconeClient = null;
let index = null;

const INDEX_NAME = 'novashop-kb';
const NAMESPACE = 'products';

async function initPinecone() {
  if (pineconeClient) return pineconeClient;
  
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    logger.warn('[Pinecone] PINECONE_API_KEY not configured');
    return null;
  }
  
  try {
    pineconeClient = new Pinecone({ apiKey });
    
    // Get or create index
    try {
      const existingIndex = await pineconeClient.describeIndex(INDEX_NAME);
      logger.info('[Pinecone] Using existing index:', INDEX_NAME);
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        logger.info('[Pinecone] Creating new index:', INDEX_NAME);
        await pineconeClient.createIndex({
          name: INDEX_NAME,
          dimension: 1536,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        logger.info('[Pinecone] Index created successfully');
      } else {
        throw error;
      }
    }
    
    index = pineconeClient.index(INDEX_NAME);
    logger.info('[Pinecone] Initialized successfully');
    return pineconeClient;
  } catch (error) {
    logger.error('[Pinecone] Failed to initialize:', error);
    return null;
  }
}

async function upsertDocument(id, vector, metadata) {
  const client = await initPinecone();
  if (!client || !index) {
    throw new Error('Pinecone not initialized');
  }
  
  try {
    await index.upsert([{
      id,
      values: vector,
      metadata
    }]);
    logger.info(`[Pinecone] Document upserted: ${id}`);
  } catch (error) {
    logger.error('[Pinecone] Failed to upsert document:', error);
    throw error;
  }
}

async function queryEmbeddings(vector, topK = 5, filter = {}) {
  const client = await initPinecone();
  if (!client || !index) {
    throw new Error('Pinecone not initialized');
  }
  
  try {
    const results = await index.query({
      vector,
      topK,
      includeMetadata: true,
      namespace: NAMESPACE,
      filter
    });
    
    return results.matches || [];
  } catch (error) {
    logger.error('[Pinecone] Failed to query embeddings:', error);
    throw error;
  }
}

async function deleteDocument(id) {
  const client = await initPinecone();
  if (!client || !index) {
    throw new Error('Pinecone not initialized');
  }
  
  try {
    await index.deleteOne(id, NAMESPACE);
    logger.info(`[Pinecone] Document deleted: ${id}`);
  } catch (error) {
    logger.error('[Pinecone] Failed to delete document:', error);
    throw error;
  }
}

async function deleteAllDocuments() {
  const client = await initPinecone();
  if (!client || !index) {
    throw new Error('Pinecone not initialized');
  }
  
  try {
    await index.deleteAll({ namespace: NAMESPACE });
    logger.info('[Pinecone] All documents deleted');
  } catch (error) {
    logger.error('[Pinecone] Failed to delete all documents:', error);
    throw error;
  }
}

module.exports = {
  initPinecone,
  upsertDocument,
  queryEmbeddings,
  deleteDocument,
  deleteAllDocuments
};
