#!/usr/bin/env node

// Test script to verify the GitHub package works with Infisical config
import { createGitHubApp, getGitHubAppCredentials } from './client/app.js';

async function testGitHubWithInfisical() {
  try {
    const _credentials = await getGitHubAppCredentials();
    const _app = await createGitHubApp();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testGitHubWithInfisical().catch(console.error);
