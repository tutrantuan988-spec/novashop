/**
 * 🔄 SESSION RECOVERY UTILITY
 * Tự động phục hồi phiên làm việc khi bị gián đoạn
 * Pattern: everything-claude-code — recovery harness
 * 
 * Cách dùng: node scripts/session-recovery.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SESSION_DIR = path.join(__dirname, '..', '.debug-sessions');
const RECOVERY_FILE = path.join(__dirname, '..', '.session-recovery.json');

function log(msg) {
  console.log(`[SessionRecovery] ${msg}`);
}

/**
 * Kiểm tra trạng thái git hiện tại
 */
function checkGitStatus() {
  try {
    const status = execSync('git status --short', { encoding: 'utf8', cwd: path.join(__dirname, '..') });
    const files = status.split('\n').filter(Boolean);
    
    if (files.length === 0) {
      log('✅ Git clean — không có file chưa commit');
      return { dirty: false, files: [] };
    }
    
    log(`⚠️ Có ${files.length} file chưa được commit:`);
    files.forEach(f => console.log(`   ${f}`));
    return { dirty: true, files };
  } catch (err) {
    log('⚠️ Không thể kiểm tra git status:', err.message);
    return { dirty: false, files: [] };
  }
}

/**
 * Kiểm tra node_modules
 */
function checkDependencies() {
  const nodeModules = path.join(__dirname, '..', 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    log('❌ node_modules không tồn tại! Chạy: npm install');
    return false;
  }
  
  const keyDeps = ['react', 'vite', 'express', 'firebase'];
  let allGood = true;
  
  for (const dep of keyDeps) {
    const depPath = path.join(nodeModules, dep);
    if (!fs.existsSync(depPath)) {
      log(`❌ Thiếu dependency: ${dep}`);
      allGood = false;
    }
  }
  
  if (allGood) {
    log('✅ All dependencies OK');
  }
  return allGood;
}

/**
 * Kiểm tra file .env
 */
function checkEnv() {
  const envLocal = path.join(__dirname, '..', '.env.local');
  const env = path.join(__dirname, '..', '.env');
  
  if (fs.existsSync(envLocal)) {
    log('⚠️ Có file .env.local — nhớ không commit!');
    return true;
  }
  if (fs.existsSync(env)) {
    log('⚠️ Có file .env — nhớ không commit!');
    return true;
  }
  
  log('✅ No .env files leaked');
  return true;
}

/**
 * Kiểm tra port
 */
function checkPort(port = 3001) {
  try {
    const net = require('net');
    const server = require('net').createServer();
    
    return new Promise((resolve) => {
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          log(`⚠️ Port ${port} đang được sử dụng`);
          resolve(false);
        } else {
          resolve(true);
        }
      });
      
      server.once('listening', () => {
        server.close();
        log(`✅ Port ${port} trống`);
        resolve(true);
      });
      
      server.listen(port);
    });
  } catch {
    log(`⚠️ Không thể kiểm tra port ${port}`);
    return Promise.resolve(true);
  }
}

/**
 * Lưu trạng thái recovery
 */
function saveRecoveryState(state) {
  try {
    fs.writeFileSync(RECOVERY_FILE, JSON.stringify(state, null, 2));
    log('✅ Đã lưu trạng thái recovery');
  } catch (err) {
    log('⚠️ Không thể lưu recovery state:', err.message);
  }
}

/**
 * Đọc trạng thái recovery
 */
function loadRecoveryState() {
  try {
    if (fs.existsSync(RECOVERY_FILE)) {
      const data = JSON.parse(fs.readFileSync(RECOVERY_FILE, 'utf8'));
      log(`📋 Tìm thấy recovery state từ ${data.lastCheck || 'unknown'}`);
      return data;
    }
  } catch {}
  return null;
}

/**
 * Main recovery check
 */
async function run() {
  console.log('\n========================================');
  console.log('  🔄 SESSION RECOVERY');
  console.log('  TRỌNG ĐỊNH STORE');
  console.log('========================================\n');

  // Load previous state
  const prevState = loadRecoveryState();
  
  if (prevState) {
    log('📋 Phiên làm việc trước:');
    if (prevState.uncommitted > 0) log(`   - ${prevState.uncommitted} file chưa commit`);
    if (prevState.depsOk) log('   - Dependencies OK');
    if (!prevState.depsOk) log('   - ❌ Cần npm install');
    console.log('');
  }

  // Run checks in parallel
  const gitStatus = checkGitStatus();
  const depsOk = checkDependencies();
  const envOk = checkEnv();
  const portOk = await checkPort();
  
  // Save recovery state
  saveRecoveryState({
    lastCheck: new Date().toISOString(),
    uncommitted: gitStatus.files.length,
    depsOk,
    envOk,
    portOk,
  });

  // Summary
  console.log('\n========================================');
  console.log('  📊 RECOVERY SUMMARY');
  console.log('========================================');
  
  if (gitStatus.dirty) {
    console.log('  ⚠️  Chạy: git add -A && git commit -m "..." && git push');
  }
  if (!depsOk) {
    console.log('  ❌ Chạy: npm install');
  }
  if (!portOk) {
    console.log('  ⚠️  Port 3001 đang bận. Dùng: PORT=3002 npm run server');
  }
  if (!gitStatus.dirty && depsOk && envOk && portOk) {
    console.log('  ✅ Mọi thứ OK! Sẵn sàng để dev.');
    console.log('  💻 npm run dev    — Frontend');
    console.log('  🖥️  npm run server  — Backend');
  }
  
  console.log('\n========================================\n');
}

run().catch(err => {
  console.error('Recovery error:', err.message);
  process.exit(1);
});
