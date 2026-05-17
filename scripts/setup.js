#!/usr/bin/env node

/**
 * Project Setup Script — Pattern từ everything-claude-code
 * 
 * Chạy một lệnh duy nhất để setup toàn bộ project:
 *   node scripts/setup.js
 *   npm run setup:all
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
  bold: '\x1b[1m'
};

function log(label, status, details = '') {
  const icon = status === 'ok' ? '✅' : status === 'warn' ? '⚠️' : status === 'skip' ? '⏭️' : '❌';
  const color = status === 'ok' ? colors.green : status === 'warn' ? colors.yellow : colors.red;
  console.log(`  ${color}${icon} ${label}${details ? ': ' + details : ''}${colors.reset}`);
}

function run(cmd, label) {
  try {
    execSync(cmd, { stdio: 'pipe', timeout: 60000 });
    log(label, 'ok');
    return true;
  } catch (e) {
    if (e.stderr) {
      const msg = e.stderr.toString().split('\n')[0].trim();
      log(label, 'fail', msg.substring(0, 80));
    } else {
      log(label, 'fail', e.message.substring(0, 80));
    }
    return false;
  }
}

async function setup() {
  console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  🚀 SETUP — TRỌNG ĐỊNH STORE${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  Pattern: everything-claude-code${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

  // ===== Step 1: Check environment =====
  console.log(`${colors.bold}📋 Kiểm tra môi trường${colors.reset}`);
  
  try {
    const nodeVer = execSync('node --version').toString().trim();
    log('Node.js', 'ok', nodeVer);
  } catch {
    log('Node.js', 'fail', 'Chưa cài Node.js!');
    process.exit(1);
  }

  try {
    const npmVer = execSync('npm --version').toString().trim();
    log('npm', 'ok', npmVer);
  } catch {
    log('npm', 'fail');
  }

  // ===== Step 2: Install dependencies =====
  console.log(`\n${colors.bold}📦 Cài đặt dependencies${colors.reset}`);
  
  if (fs.existsSync('node_modules')) {
    log('node_modules', 'ok', 'Đã tồn tại');
  } else {
    run('npm install', 'npm install');
  }

  // ===== Step 3: Environment setup =====
  console.log(`\n${colors.bold}🔧 Cấu hình môi trường${colors.reset}`);
  
  if (fs.existsSync('.env.local')) {
    log('.env.local', 'ok', 'Đã tồn tại');
  } else if (fs.existsSync('.env.local.example')) {
    try {
      fs.copyFileSync('.env.local.example', '.env.local');
      log('.env.local', 'ok', 'Đã tạo từ .env.local.example');
      log('⚠️ Hãy điền API keys vào .env.local', 'warn');
    } catch {
      log('.env.local', 'fail');
    }
  } else {
    log('.env.local', 'skip', 'Không tìm thấy .env.local.example');
  }

  // ===== Step 4: Git hooks =====
  console.log(`\n${colors.bold}🔗 Cài đặt Git Hooks${colors.reset}`);
  
  const hooksDir = '.git/hooks';
  const hooksSource = '.hooks';
  
  if (fs.existsSync(hooksSource)) {
    let installed = 0;
    for (const hook of ['pre-commit', 'post-commit']) {
      const source = path.join(hooksSource, hook);
      const dest = path.join(hooksDir, hook);
      if (fs.existsSync(source)) {
        try {
          fs.copyFileSync(source, dest);
          try { fs.chmodSync(dest, 0o755); } catch {}
          installed++;
        } catch {}
      }
    }
    log(`Git hooks (${installed}/2 installed)`, installed > 0 ? 'ok' : 'warn');
  } else {
    log('Git hooks', 'skip', '.hooks/ không tồn tại');
  }

  // ===== Step 5: Create dirs =====
  console.log(`\n${colors.bold}📁 Tạo thư mục cần thiết${colors.reset}`);
  
  const dirs = ['.debug-sessions', 'e2e/report'];
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log(dir, 'ok');
      } else {
        log(dir, 'ok', 'Đã tồn tại');
      }
    } catch {
      log(dir, 'fail');
    }
  }

  // ===== Step 6: Check E2E =====
  console.log(`\n${colors.bold}🧪 Kiểm tra E2E${colors.reset}`);
  
  if (fs.existsSync('node_modules/@playwright')) {
    // Already installed
  }
  log('playwright.config.js', fs.existsSync('playwright.config.js') ? 'ok' : 'warn');
  log('e2e/smoke.spec.js', fs.existsSync('e2e/smoke.spec.js') ? 'ok' : 'warn');

  // ===== Step 7: Check MCP =====
  console.log(`\n${colors.bold}🔌 MCP Integration Check${colors.reset}`);
  
  log('.mcp.json', fs.existsSync('.mcp.json') ? 'ok' : 'warn');
  log('.claude-plugin.json', fs.existsSync('.claude-plugin.json') ? 'ok' : 'warn');

  // ===== Summary =====
  console.log(`\n${colors.bold}${colors.green}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.green}  ✅ Setup hoàn tất!${colors.reset}`);
  console.log(`${colors.bold}${colors.green}═══════════════════════════════════════${colors.reset}\n`);
  
  console.log(`  ${colors.bold}🚀 Lệnh hữu ích:${colors.reset}`);
  console.log(`  npm run dev             Khởi chạy frontend (Vite)`);
  console.log(`  npm run server          Khởi chạy backend (Express)`);
  console.log(`  npm run build           Build production`);
  console.log(`  npm run check           Kiểm tra toàn bộ project`);
  console.log(`  npm run debug <issue>   Debug với Sequential Thinking`);
  console.log(`  npm run test:e2e        Chạy E2E tests\n`);
  
  console.log(`  📖 Xem thêm: docs/MCP_SERVERS_SETUP.md`);
  console.log(`  📖 Xem thêm: docs/SEQUENTIAL_THINKING.md\n`);
}

setup().catch(console.error);
