const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const groups = [
  {
    name: 'Core backend',
    phase: 'required',
    required: ['ADMIN_API_TOKEN', 'GUEST_TOKEN_SECRET', 'CLIENT_URL'],
    optional: ['PUBLIC_API_URL', 'PORT', 'NODE_ENV']
  },
  {
    name: 'Firestore database',
    phase: 'required',
    required: ['FIREBASE_PROJECT_ID', 'FIREBASE_SERVICE_ACCOUNT'],
    optional: [
      'FIREBASE_SERVICE_ACCOUNT_FILE',
      'FIREBASE_SERVICE_ACCOUNT_JSON',
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ]
  },
  {
    name: 'Email',
    phase: 'integration',
    required: ['RESEND_API_KEY', 'EMAIL_FROM', 'ADMIN_NOTIFICATION_EMAIL'],
    optional: []
  },
  {
    name: 'Stripe payments',
    phase: 'integration',
    required: ['VITE_STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    optional: ['STRIPE_SUBSCRIPTION_WEBHOOK_SECRET']
  },
  {
    name: 'GHN shipping',
    phase: 'integration',
    required: ['GHN_API_TOKEN', 'GHN_SHOP_ID'],
    optional: ['GHN_API_URL']
  },
  {
    name: 'Cloudinary uploads',
    phase: 'integration',
    required: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
    optional: []
  },
  {
    name: 'Algolia search',
    phase: 'integration',
    required: ['ALGOLIA_APP_ID', 'ALGOLIA_ADMIN_API_KEY', 'ALGOLIA_INDEX_NAME', 'VITE_ALGOLIA_APP_ID', 'VITE_ALGOLIA_SEARCH_KEY', 'VITE_ALGOLIA_INDEX_NAME'],
    optional: []
  },
  {
    name: 'AI chatbot RAG',
    phase: 'integration',
    required: ['OPENAI_API_KEY', 'PINECONE_API_KEY'],
    optional: []
  },
  {
    name: 'Monitoring',
    phase: 'integration',
    required: ['SENTRY_DSN', 'VITE_SENTRY_DSN'],
    optional: ['VITE_SENTRY_TRACES_SAMPLE_RATE']
  }
];

function hasValue(key) {
  if (key === 'FIREBASE_SERVICE_ACCOUNT') {
    return hasValue('FIREBASE_SERVICE_ACCOUNT_JSON') || hasReadableFile('FIREBASE_SERVICE_ACCOUNT_FILE') || hasReadableFile('GOOGLE_APPLICATION_CREDENTIALS');
  }
  const value = process.env[key];
  return !!value && value !== 'your_key_here' && !value.endsWith('_xxx') && value !== '{}';
}

function hasReadableFile(key) {
  const value = process.env[key];
  if (!value || value === 'your_key_here') return false;
  const filePath = path.isAbsolute(value) ? value : path.resolve(__dirname, '..', value);
  return fs.existsSync(filePath);
}

function statusLine(key) {
  return `  ${hasValue(key) ? 'OK     ' : 'MISSING'} ${key}`;
}

let missingRequired = 0;
let missingIntegrations = 0;

console.log('Production configuration check');
console.log('Reading .env.local\n');

groups.forEach((group) => {
  const requiredMissing = group.required.filter((key) => !hasValue(key));
  if (group.phase === 'required') {
    missingRequired += requiredMissing.length;
  } else {
    missingIntegrations += requiredMissing.length;
  }

  console.log(`${group.name} (${group.phase === 'required' ? 'required now' : 'optional integration'})`);
  group.required.forEach((key) => console.log(statusLine(key)));
  group.optional.forEach((key) => console.log(`  ${hasValue(key) ? 'OK     ' : 'OPTION '} ${key}`));
  console.log('');
});

if (missingRequired > 0) {
  console.log(`Missing values required for live database setup: ${missingRequired}`);
  console.log('Fill Firebase and core backend values first, then run npm run seed:firestore.');
  process.exitCode = 1;
} else {
  console.log('Core live database values are present.');
  if (missingIntegrations > 0) {
    console.log(`Optional integration values still missing: ${missingIntegrations}`);
  }
}
