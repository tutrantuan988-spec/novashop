#!/usr/bin/env node

/**
 * Sequential Debug Workflow — Pattern from Sequential Thinking MCP
 * 
 * Công cụ debug có cấu trúc cho developer:
 * - Step-by-step problem analysis
 * - Branch exploration (multiple hypotheses)
 * - Revision history tracking
 * - Conclusion synthesis
 * 
 * Usage:
 *   node scripts/debug-workflow.js "Mô tả vấn đề"
 *   node scripts/debug-workflow.js --init "Tạo workflow mới"
 */

const fs = require('fs');
const path = require('path');

// ===== Color helpers for terminal =====
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

// ===== Sequential Thinking Engine =====
class SequentialDebugger {
  constructor(problem) {
    this.problem = problem;
    this.thoughts = [];
    this.branches = [];
    this.startTime = Date.now();
    this.sessionId = `debug_${Date.now()}`;
  }

  /**
   * Bước 1: Define problem
   */
  defineProblem(description, context = '') {
    this.thoughts.push({
      step: this.thoughts.length + 1,
      type: 'problem',
      content: description,
      context,
      timestamp: new Date().toISOString()
    });
    
    this._printStep('🔍', 'PROBLEM', description, colors.red);
    if (context) console.log(`${colors.dim}   Context: ${context}${colors.reset}\n`);
  }

  /**
   * Bước 2: Gather facts
   */
  addFact(fact, source = '') {
    this.thoughts.push({
      step: this.thoughts.length + 1,
      type: 'fact',
      content: fact,
      source,
      timestamp: new Date().toISOString()
    });
    
    this._printStep('📌', 'FACT', fact, colors.blue);
    if (source) console.log(`${colors.dim}   Source: ${source}${colors.reset}`);
  }

  /**
   * Bước 3: Form hypotheses (branches)
   */
  addHypothesis(hypothesis, probability = 'medium') {
    const branch = {
      id: `B${this.branches.length + 1}`,
      hypothesis,
      probability, // high, medium, low
      evidence: [],
      verified: null,
      timestamp: new Date().toISOString()
    };
    
    this.branches.push(branch);
    this.thoughts.push({
      step: this.thoughts.length + 1,
      type: 'hypothesis',
      branch: branch.id,
      content: hypothesis,
      probability,
      timestamp: new Date().toISOString()
    });
    
    const probColor = probability === 'high' ? colors.green : 
                      probability === 'medium' ? colors.yellow : colors.gray;
    this._printStep('🧪', `HYPOTHESIS [${branch.id}]`, hypothesis, probColor);
    console.log(`   ${colors.dim}Probability: ${probability}${colors.reset}\n`);
  }

  /**
   * Bước 4: Add evidence to hypothesis
   */
  addEvidence(branchId, evidence, supports = true) {
    const branch = this.branches.find(b => b.id === branchId);
    if (!branch) {
      console.log(`${colors.red}❌ Branch ${branchId} not found${colors.reset}`);
      return;
    }
    
    branch.evidence.push({ evidence, supports, timestamp: new Date().toISOString() });
    
    this.thoughts.push({
      step: this.thoughts.length + 1,
      type: 'evidence',
      branch: branchId,
      content: evidence,
      supports,
      timestamp: new Date().toISOString()
    });
    
    const icon = supports ? '✅' : '❌';
    const label = supports ? 'SUPPORTS' : 'REFUTES';
    this._printStep(icon, `${label} [${branchId}]`, evidence, supports ? colors.green : colors.red);
  }

  /**
   * Bước 5: Verify hypothesis
   */
  verifyHypothesis(branchId, verified) {
    const branch = this.branches.find(b => b.id === branchId);
    if (!branch) return;
    
    branch.verified = verified;
    
    this.thoughts.push({
      step: this.thoughts.length + 1,
      type: 'verification',
      branch: branchId,
      content: verified ? 'Hypothesis confirmed' : 'Hypothesis rejected',
      timestamp: new Date().toISOString()
    });
    
    if (verified) {
      this._printStep('🎯', 'VERIFIED', `Branch ${branchId}: ${branch.hypothesis}`, colors.green);
    } else {
      this._printStep('💀', 'REJECTED', `Branch ${branchId}: ${branch.hypothesis}`, colors.red);
    }
  }

  /**
   * Bước 6: Draw conclusion
   */
  conclude(solution, actionItems = []) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    this.thoughts.push({
      step: this.thoughts.length + 1,
      type: 'conclusion',
      content: solution,
      actionItems,
      elapsed,
      timestamp: new Date().toISOString()
    });
    
    console.log(`\n${colors.bold}${colors.green}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}${colors.green}  🎯 KẾT LUẬN (${elapsed}s)${colors.reset}`);
    console.log(`${colors.bold}${colors.green}═══════════════════════════════════════${colors.reset}\n`);
    console.log(`  ${solution}\n`);
    
    if (actionItems.length > 0) {
      console.log(`  ${colors.bold}📋 Action Items:${colors.reset}`);
      actionItems.forEach((item, i) => {
        console.log(`    ${i + 1}. ${item}`);
      });
      console.log();
    }
    
    // Save session
    this._saveSession();
  }

  /**
   * Print summary of all steps
   */
  summarize() {
    console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}  📊 DEBUG SESSION SUMMARY${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);
    
    console.log(`  Problem: ${this.problem}`);
    console.log(`  Steps: ${this.thoughts.length}`);
    console.log(`  Hypotheses: ${this.branches.length}`);
    console.log(`  Verified: ${this.branches.filter(b => b.verified === true).length}`);
    console.log(`  Rejected: ${this.branches.filter(b => b.verified === false).length}`);
    console.log(`  Pending: ${this.branches.filter(b => b.verified === null).length}`);
    console.log(`  Duration: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s\n`);
    
    // Show thought chain
    console.log(`${colors.dim}Thought chain:${colors.reset}`);
    this.thoughts.forEach(t => {
      const icon = t.type === 'problem' ? '🔍' :
                   t.type === 'fact' ? '📌' :
                   t.type === 'hypothesis' ? '🧪' :
                   t.type === 'evidence' ? (t.supports ? '✅' : '❌') :
                   t.type === 'verification' ? (t.verified ? '🎯' : '💀') :
                   t.type === 'conclusion' ? '🏁' : '📝';
      console.log(`  ${icon} Step ${t.step}: ${t.content.substring(0, 80)}${t.content.length > 80 ? '...' : ''}`);
    });
    console.log();
  }

  _printStep(icon, label, content, color) {
    console.log(`${color}${icon} [${label}] ${content}${colors.reset}`);
  }

  _saveSession() {
    const sessionsDir = path.join(process.cwd(), '.debug-sessions');
    try {
      if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });
      
      const sessionFile = path.join(sessionsDir, `${this.sessionId}.json`);
      fs.writeFileSync(sessionFile, JSON.stringify({
        problem: this.problem,
        thoughts: this.thoughts,
        branches: this.branches,
        startTime: this.startTime,
        sessionId: this.sessionId
      }, null, 2));
      
      console.log(`${colors.dim}   💾 Saved: ${sessionFile}${colors.reset}\n`);
    } catch (e) {
      // Silent fail
    }
  }

  /**
   * List previous debug sessions
   */
  static listSessions() {
    const sessionsDir = path.join(process.cwd(), '.debug-sessions');
    try {
      if (!fs.existsSync(sessionsDir)) {
        console.log('Chưa có debug sessions nào.');
        return;
      }
      
      const files = fs.readdirSync(sessionsDir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse();
      
      console.log(`\n${colors.bold}📋 Debug Sessions (${files.length}):${colors.reset}\n`);
      files.forEach(f => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(sessionsDir, f), 'utf-8'));
          console.log(`  📄 ${f.replace('.json', '')}`);
          console.log(`     Problem: ${data.problem.substring(0, 60)}`);
          console.log(`     Steps: ${data.thoughts.length} | Hypotheses: ${data.branches.length}`);
          console.log();
        } catch {}
      });
    } catch {}
  }
}

// ===== CLI =====
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--init') || args.includes('--new')) {
    const problem = args.filter(a => !a.startsWith('--')).join(' ') || 'New debug session';
    const debugger_ = new SequentialDebugger(problem);
    console.log(`\n${colors.bold}${colors.cyan}🧠 Sequential Debug Session Started${colors.reset}\n`);
    console.log(`  Problem: ${problem}`);
    console.log(`  Session: ${debugger_.sessionId}\n`);
    console.log(`${colors.dim}API Reference:${colors.reset}`);
    console.log(`  debugger.defineProblem(description, context)`);
    console.log(`  debugger.addFact(fact, source)`);
    console.log(`  debugger.addHypothesis(hypothesis, 'high|medium|low')`);
    console.log(`  debugger.addEvidence(branchId, evidence, supports=true)`);
    console.log(`  debugger.verifyHypothesis(branchId, verified)`);
    console.log(`  debugger.conclude(solution, actionItems[])`);
    console.log(`  debugger.summarize()\n`);
    
    // Export to global
    global.sequentialDebugger = debugger_;
    console.log(`   → Global variable set: sequentialDebugger\n`);
    
  } else if (args.includes('--list') || args.includes('--ls')) {
    SequentialDebugger.listSessions();
    
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`\n${colors.bold}Sequential Debug Workflow${colors.reset}`);
    console.log(`\nUsage:`);
    console.log(`  node scripts/debug-workflow.js --init "<problem>"   Bắt đầu debug session mới`);
    console.log(`  node scripts/debug-workflow.js --list               Liệt kê sessions trước`);
    console.log(`  node scripts/debug-workflow.js --help               Hướng dẫn này\n`);
    
  } else {
    // Quick run: auto-create session for the problem
    const problem = args.join(' ') || 'Undefined problem';
    const debugger_ = new SequentialDebugger(problem);
    
    debugger_.defineProblem(problem);
    debugger_.addFact('Running initial analysis...');
    debugger_.addHypothesis('Need more information to form hypothesis');
    debugger_.summarize();
    
    console.log(`\n${colors.yellow}💡 Tip: Use --init for interactive mode${colors.reset}\n`);
  }
}

module.exports = SequentialDebugger;
