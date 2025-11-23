#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envExamplePath = path.join(__dirname, '..', 'env.example');
const envLocalPath = path.join(__dirname, '..', '.env.local');

// Check if .env.local already exists
if (fs.existsSync(envLocalPath)) {
  console.log('⚠️  .env.local already exists!');
  console.log('If you want to recreate it, delete the existing file first.');
  process.exit(0);
}

// Check if env.example exists
if (!fs.existsSync(envExamplePath)) {
  console.log('❌ env.example file not found!');
  process.exit(1);
}

try {
  // Copy env.example to .env.local
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  fs.writeFileSync(envLocalPath, envContent);

  console.log('✅ Created .env.local from env.example');
  console.log('📝 Please edit .env.local with your actual values:');
  console.log('   - Database connection string');
  console.log('   - JWT secrets (generate strong random strings)');
  console.log('   - SMTP credentials');
  console.log('   - OAuth provider credentials');
  console.log('');
  console.log('🔐 Security reminder:');
  console.log('   - Never commit .env.local to version control');
  console.log('   - Use strong, unique secrets in production');
  console.log('   - Keep your secrets secure');
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
  process.exit(1);
}
