/**
 * 🧠 Agent Orchestrator Initializer
 * 
 * Khởi tạo và quản lý vòng đời của Agent System.
 * Được gọi từ server/index.js khi server start.
 */

const orchestrator = require('../../agents/orchestrator');
const logger = require('../utils/logger');

let initialized = false;

async function initialize() {
  if (initialized) {
    logger.info('[AgentInit] System already initialized');
    return orchestrator.getStatus();
  }

  logger.info('[AgentInit] Initializing agent system...');
  
  try {
    const status = await orchestrator.initialize();
    initialized = true;
    
    logger.info(`[AgentInit] ✅ ${status.agents.length} agents registered`);
    logger.info(`[AgentInit] ✅ ${status.workflows?.templates?.length || 0} workflow templates available`);
    
    return status;
  } catch (err) {
    logger.error('[AgentInit] Initialization failed:', err.message);
    throw err;
  }
}

async function shutdown() {
  if (!initialized) return;
  await orchestrator.shutdown();
  initialized = false;
  logger.info('[AgentInit] System shut down');
}

function getStatus() {
  return orchestrator.getStatus();
}

module.exports = {
  initialize,
  shutdown,
  getStatus,
  get isInitialized() { return initialized; }
};
