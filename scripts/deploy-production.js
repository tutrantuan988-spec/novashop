/**
 * 🚀 DEPLOY PRODUCTION SCRIPT
 * Tự động kiểm tra và fix config cho production deployment
 * 
 * Cách dùng: node scripts/deploy-production.js
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_ENV_VARS = [
  'VITE_CLERK_PUBLISHABLE_KEY',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const CHECKS = {
  passed: [],
  warnings: [],
  errors: [],
};

function log(type, msg) {
  const icons = { passed: '✅', warnings: '⚠️', errors: '❌' };
  console.log(`  ${icons[type] || 'ℹ️'} ${msg}`);
  CHECKS[type].push(msg);
}

async function run() {
  console.log('\n========================================');
  console.log('  🚀 DEPLOY PRODUCTION CHECKLIST');
  console.log('  TRỌNG ĐỊNH STORE');
  console.log('========================================\n');

  // === 1. Kiểm tra .env ===
  console.log('📁 1. Kiểm tra file .env');
  const envPath = path.join(__dirname, '..', '.env');
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  
  if (fs.existsSync(envLocalPath)) {
    log('warnings', 'Có file .env.local — nếu chứa key thật, ĐỪNG commit!');
  }
  if (fs.existsSync(envPath)) {
    log('warnings', 'Có file .env — nếu chứa key thật, ĐỪNG commit!');
  }

  // === 2. Kiểm tra Clerk key ===
  console.log('\n🔐 2. Kiểm tra Clerk Auth');
  const mainJsx = path.join(__dirname, '..', 'src', 'main.jsx');
  if (fs.existsSync(mainJsx)) {
    const content = fs.readFileSync(mainJsx, 'utf8');
    if (content.includes('pk_test_')) {
      log('warnings', 'Clerk đang dùng DEVELOPMENT key (pk_test_)! Cần đổi sang pk_live_');
    } else if (content.includes('pk_live_')) {
      log('passed', 'Clerk dùng production key');
    } else {
      log('passed', 'Clerk key đọc từ env var (đúng cách)');
    }
  }

  // === 3. Kiểm tra biến môi trường ===
  console.log('\n🌍 3. Kiểm tra biến môi trường');
  const envExample = path.join(__dirname, '..', '.env.local.example');
  if (fs.existsSync(envExample)) {
    const envContent = fs.readFileSync(envExample, 'utf8');
    for (const varName of REQUIRED_ENV_VARS) {
      if (envContent.includes(varName)) {
        log('passed', `${varName} — có trong .env.local.example`);
      } else {
        log('warnings', `${varName} — KHÔNG có trong .env.local.example`);
      }
    }
  }

  // === 4. Kiểm tra netlify.toml ===
  console.log('\n🌐 4. Kiểm tra Netlify config');
  const netlifyToml = path.join(__dirname, '..', 'netlify.toml');
  if (fs.existsSync(netlifyToml)) {
    const netlifyContent = fs.readFileSync(netlifyToml, 'utf8');
    if (netlifyContent.includes('[build]')) {
      log('passed', 'netlify.toml: có build command');
    }
    if (netlifyContent.includes('[[redirects]]')) {
      log('passed', 'netlify.toml: có SPA redirects');
    }
    if (netlifyContent.includes('[[headers]]')) {
      log('passed', 'netlify.toml: có security headers');
    }
  } else {
    log('errors', 'Thiếu netlify.toml! Site sẽ không deploy đúng cách');
  }

  // === 5. Kiểm tra GitHub Actions ===
  console.log('\n⚡ 5. Kiểm tra GitHub Actions');
  const workflowDir = path.join(__dirname, '..', '.github', 'workflows');
  if (fs.existsSync(workflowDir)) {
    const workflows = fs.readdirSync(workflowDir).filter(f => f.endsWith('.yml'));
    if (workflows.length > 0) {
      log('passed', `Có ${workflows.length} workflow(s): ${workflows.join(', ')}`);
    } else {
      log('warnings', 'Thư mục workflows rỗng!');
    }
  } else {
    log('warnings', 'Không có CI/CD pipeline! Tạo .github/workflows/deploy.yml');
  }

  // === 6. Kiểm tra package.json ===
  console.log('\n📦 6. Kiểm tra dependencies');
  const pkg = require(path.join(__dirname, '..', 'package.json'));
  const criticalDeps = ['@clerk/clerk-react', 'firebase', 'stripe', 'react', 'react-dom', 'vite'];
  for (const dep of criticalDeps) {
    if (pkg.dependencies?.[dep]) {
      log('passed', `${dep} — ${pkg.dependencies[dep]}`);
    } else if (pkg.devDependencies?.[dep]) {
      log('passed', `${dep} (dev) — ${pkg.devDependencies[dep]}`);
    } else {
      log('errors', `Thiếu dependency: ${dep}!`);
    }
  }

  // === 7. Kiểm tra scripts ===
  console.log('\n📜 7. Kiểm tra scripts');
  const requiredScripts = ['dev', 'build', 'start', 'seed'];
  for (const script of requiredScripts) {
    if (pkg.scripts?.[script]) {
      log('passed', `npm run ${script} — ${pkg.scripts[script]}`);
    } else {
      log('errors', `Thiếu script: ${script}!`);
    }
  }

  // === 8. Kiểm tra security ===
  console.log('\n🔒 8. Kiểm tra security cơ bản');
  const gitignore = path.join(__dirname, '..', '.gitignore');
  if (fs.existsSync(gitignore)) {
    const gitignoreContent = fs.readFileSync(gitignore, 'utf8');
    const patterns = ['.env', '.env.local', 'firebase-admin', 'serviceAccount', '*.pem', 'node_modules'];
    for (const pattern of patterns) {
      if (gitignoreContent.includes(pattern)) {
        log('passed', `.gitignore: ${pattern}`);
      } else {
        log('warnings', `.gitignore: thiếu ${pattern}!`);
      }
    }
  }

  // === KẾT QUẢ ===
  console.log('\n========================================');
  console.log('  📊 KẾT QUẢ KIỂM TRA');
  console.log('========================================');
  console.log(`  ✅ Passed: ${CHECKS.passed.length}`);
  console.log(`  ⚠️  Warnings: ${CHECKS.warnings.length}`);
  console.log(`  ❌ Errors: ${CHECKS.errors.length}`);
  
  if (CHECKS.errors.length > 0) {
    console.log('\n  ❌ CÁC LỖI CẦN SỬA:');
    CHECKS.errors.forEach(e => console.log(`     - ${e}`));
  }
  if (CHECKS.warnings.length > 0) {
    console.log('\n  ⚠️  CÁC CẢNH BÁO:');
    CHECKS.warnings.forEach(w => console.log(`     - ${w}`));
  }

  console.log('\n  📖 Chi tiết: xem PRODUCTION_DEPLOYMENT_GUIDE.md\n');
  console.log('========================================\n');

  process.exit(CHECKS.errors.length > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
