#!/usr/bin/env node

/**
 * Environment Check Script — Pre-commit hook utility
 * Pattern from everything-claude-code
 * 
 * Kiểm tra các biến môi trường cần thiết trước khi commit
 * Chạy: node scripts/check-env.js
 */

// Load biến môi trường từ .env.local trước
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const REQUIRED_VARS = {
  VITE_CLERK_PUBLISHABLE_KEY: 'Clerk Auth',
  VITE_FIREBASE_API_KEY: 'Firebase API',
  VITE_FIREBASE_PROJECT_ID: 'Firebase Project',
  VITE_STRIPE_PUBLISHABLE_KEY: 'Stripe Payment',
};

const OPTIONAL_VARS = {
  VITE_API_URL: 'Backend API URL',
  ADMIN_API_TOKEN: 'Admin Security Token',
  RESEND_API_KEY: 'Email Service',
  VITE_SENTRY_DSN: 'Error Monitoring',
};

function checkEnv() {
  console.log('\n🔍 Kiểm tra biến môi trường...\n');

  const missing = [];
  const warnings = [];

  // Kiểm tra .env.local
  const fs = require('fs');
  const path = require('path');
  
  const envFiles = ['.env.local', '.env', '.env.development'];
  let hasEnvFile = false;

  for (const file of envFiles) {
    try {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        hasEnvFile = true;
        console.log(`  ✅ Found: ${file}`);
        break;
      }
    } catch {}
  }

  if (!hasEnvFile) {
    console.log('  ⚠️  Không tìm thấy file .env.local — copy từ .env.local.example\n');
  }

  // Kiểm tra biến bắt buộc
  console.log('  Biến bắt buộc:');
  for (const [key, label] of Object.entries(REQUIRED_VARS)) {
    if (!process.env[key]) {
      missing.push(key);
      console.log(`  ❌ ${key} (${label}) — THIẾU`);
    } else {
      const val = process.env[key];
      const masked = val.length > 10 ? val.substring(0, 10) + '...' : val;
      console.log(`  ✅ ${key} (${label}) = ${masked}`);
    }
  }

  // Kiểm tra biến tuỳ chọn
  console.log('\n  Biến tuỳ chọn:');
  for (const [key, label] of Object.entries(OPTIONAL_VARS)) {
    if (!process.env[key]) {
      warnings.push(key);
      console.log(`  ⚠️  ${key} (${label}) — chưa cấu hình`);
    } else {
      console.log(`  ✅ ${key} (${label})`);
    }
  }

  // Kết luận
  console.log('\n  ===== Kết luận =====');
  if (missing.length === 0) {
    console.log('  ✅ Tất cả biến bắt buộc đã được cấu hình!\n');
    return true;
  } else {
    console.log(`  ❌ Thiếu ${missing.length} biến bắt buộc:\n`);
    missing.forEach(k => console.log(`     - ${k} (${REQUIRED_VARS[k]})`));
    console.log('\n  Copy .env.local.example → .env.local và điền giá trị\n');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  const passed = checkEnv();
  process.exit(passed ? 0 : 1);
}

module.exports = checkEnv;
