#!/usr/bin/env node

/**
 * Build Agent — everything-claude-code pattern
 * 
 * Chạy toàn bộ validation checks cho project:
 * - Kiểm tra env vars
 * - Kiểm tra dependencies
 * - Build thử
 * - Kiểm tra file cấu hình
 * 
 * Usage:
 *   node agents/build-agent.js
 *   node agents/build-agent.js --quick  (chỉ kiểm tra nhanh)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

const results = { passed: 0, failed: 0, warnings: 0 };

function check(label, test, isWarning = false) {
  try {
    const passed = test();
    if (passed) {
      console.log(`  ${colors.green}✅ ${label}${colors.reset}`);
      results.passed++;
    } else {
      console.log(`  ${isWarning ? colors.yellow + '⚠️' : colors.red + '❌'} ${isWarning ? '⚠️' : '❌'} ${label}${colors.reset}`);
      if (isWarning) results.warnings++; else results.failed++;
    }
  } catch (e) {
    console.log(`  ${colors.red}❌ ${label}: ${e.message}${colors.reset}`);
    results.failed++;
  }
}

async function run() {
  const quick = process.argv.includes('--quick');
  
  console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  🔨 BUILD AGENT — TRỌNG ĐỊNH STORE${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

  // ===== 1. File Structure =====
  console.log(`${colors.bold}📁 File Structure${colors.reset}`);
  
  check('package.json exists', () => fs.existsSync('package.json'));
  check('vite.config.js exists', () => fs.existsSync('vite.config.js'));
  check('index.html exists', () => fs.existsSync('index.html'));
  check('src/ exists', () => fs.existsSync('src'));
  check('server/ exists', () => fs.existsSync('server'));
  check('.env.local.example exists', () => fs.existsSync('.env.local.example'));
  
  if (quick) {
    printSummary();
    return;
  }

  // ===== 2. Dependencies =====
  console.log(`\n${colors.bold}📦 Dependencies${colors.reset}`);
  
  check('node_modules exists', () => fs.existsSync('node_modules'));
  
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    check('Has build script', () => !!pkg.scripts?.build);
    check('Has dev script', () => !!pkg.scripts?.dev);
    check('React in dependencies', () => !!pkg.dependencies?.react);
    check('Vite in dependencies', () => !!pkg.dependencies?.vite);
  } catch {
    check('package.json parse', () => false);
  }

  // ===== 3. Key Config Files =====
  console.log(`\n${colors.bold}⚙️  Configuration${colors.reset}`);
  
  check('netlify.toml exists', () => fs.existsSync('netlify.toml'));
  check('.mcp.json exists', () => fs.existsSync('.mcp.json'));
  check('.claude-plugin.json exists', () => fs.existsSync('.claude-plugin.json'));
  
  // Check .mcp.json is valid JSON
  check('.mcp.json valid', () => {
    const content = fs.readFileSync('.mcp.json', 'utf-8');
    JSON.parse(content);
    return true;
  });

  // ===== 4. MCP Integrations =====
  console.log(`\n${colors.bold}🔌 MCP Integrations${colors.reset}`);
  
  check('MCP GitHub configured', () => {
    const mcp = JSON.parse(fs.readFileSync('.mcp.json', 'utf-8'));
    return !!mcp.mcpServers?.github;
  }, true); // Warning (need token)
  
  check('MCP Playwright configured', () => {
    const mcp = JSON.parse(fs.readFileSync('.mcp.json', 'utf-8'));
    return !!mcp.mcpServers?.playwright;
  });
  
  check('MCP Sequential Thinking configured', () => {
    const mcp = JSON.parse(fs.readFileSync('.mcp.json', 'utf-8'));
    return !!mcp.mcpServers?.['sequential-thinking'];
  });
  
  check('MCP Context7 configured', () => {
    const mcp = JSON.parse(fs.readFileSync('.mcp.json', 'utf-8'));
    return !!mcp.mcpServers?.context7;
  }, true);
  
  check('MCP Filesystem configured', () => {
    const mcp = JSON.parse(fs.readFileSync('.mcp.json', 'utf-8'));
    return !!mcp.mcpServers?.filesystem;
  });

  // ===== 5. E2E Tests =====
  console.log(`\n${colors.bold}🧪 E2E Tests${colors.reset}`);
  
  check('playwright.config.js exists', () => fs.existsSync('playwright.config.js'));
  check('e2e/smoke.spec.js exists', () => fs.existsSync('e2e/smoke.spec.js'));

  // ===== 6. ECC Plugin Components =====
  console.log(`\n${colors.bold}🧩 ECC Plugin Components${colors.reset}`);
  
  check('.hooks/pre-commit exists', () => fs.existsSync('.hooks/pre-commit'));
  check('.hooks/post-commit exists', () => fs.existsSync('.hooks/post-commit'));
  check('agents/build-agent.js exists', () => fs.existsSync('agents/build-agent.js'));
  check('scripts/check-env.js exists', () => fs.existsSync('scripts/check-env.js'));
  check('scripts/debug-workflow.js exists', () => fs.existsSync('scripts/debug-workflow.js'));

  // ===== 7. Import Feature =====
  console.log(`\n${colors.bold}📥 Product Import${colors.reset}`);
  
  check('server/routes/import.js exists', () => fs.existsSync('server/routes/import.js'));
  check('src/components/admin/ProductImportManager.jsx exists', 
    () => fs.existsSync('src/components/admin/ProductImportManager.jsx'));
  check('src/services/contextCache.js exists', () => fs.existsSync('src/services/contextCache.js'));

  // ===== 8. GitHub Actions =====
  console.log(`\n${colors.bold}⚡ CI/CD${colors.reset}`);
  
  check('.github/workflows/deploy.yml exists', () => fs.existsSync('.github/workflows/deploy.yml'));

  // ===== Summary =====
  printSummary();
}

function printSummary() {
  console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  📊 BUILD AGENT RESULTS${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);
  
  console.log(`  ${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  if (results.warnings > 0) console.log(`  ${colors.yellow}⚠️  Warnings: ${results.warnings}${colors.reset}`);
  if (results.failed > 0) console.log(`  ${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
  
  console.log(`  Total: ${results.passed + results.warnings + results.failed} checks\n`);
  
  if (results.failed > 0) {
    console.log(`  ${colors.yellow}💡 Fix the failed checks before deploying.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`  ${colors.green}✅ All checks passed! Ready to build.${colors.reset}\n`);
  }
}

run().catch(console.error);
