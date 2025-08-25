#!/usr/bin/env node

// Test script to verify the GitHub package works with Infisical config
import { getGitHubAppCredentials, createGitHubApp } from './client/app.js';

async function testGitHubWithInfisical() {
  console.log('🧪 Testing GitHub Package with Infisical Config\n');
  
  try {
    // Test 1: Get GitHub credentials
    console.log('Test 1: Fetching GitHub App credentials...');
    const credentials = await getGitHubAppCredentials();
    console.log(`✅ App ID: ${credentials.appId}`);
    console.log(`✅ Private Key: ${credentials.privateKey.substring(0, 50)}...`);
    console.log(`✅ Webhook Secret: ${credentials.webhookSecret.substring(0, 10)}...\n`);
    
    // Test 2: Create GitHub App instance
    console.log('Test 2: Creating GitHub App instance...');
    const app = await createGitHubApp();
    console.log('✅ GitHub App instance created successfully\n');
    
    console.log('🎉 All tests passed! GitHub package works with Infisical config.');
    console.log('   Secrets were loaded from .env file (local development mode).');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testGitHubWithInfisical().catch(console.error);