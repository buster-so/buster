#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');

// Database connection details from docker-compose.yml
const DB_HOST = 'host.docker.internal';
const DB_PORT = '54322';
const DB_USER = 'postgres';

// Function to check if database is accessible
function isDatabaseRunning(): boolean {
  try {
    // Use pg_isready to check if PostgreSQL is accepting connections
    execSync(`pg_isready -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER}`, {
      stdio: 'pipe',
      timeout: 45000
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to check if electric service is running
function isElectricRunning(): boolean {
  try {
    const result = execSync('docker ps --format "table {{.Names}}"', { 
      encoding: 'utf8',
      cwd: projectRoot 
    });
    return result.includes('electric-server-electric-1') || result.includes('electric-server_electric_1');
  } catch (error) {
    console.error('⚠️  Error checking docker containers:', error);
    return false;
  }
}

// Function to wait for database to be ready
async function waitForDatabaseReady(timeoutSeconds: number = 60): Promise<void> {
  console.log('🗄️  Waiting for database to be ready...');
  
  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;

  while (Date.now() - startTime < timeoutMs) {
    if (isDatabaseRunning()) {
      console.log('✅ Database is now accessible!');
      return;
    }
    
    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
    process.stdout.write('.');
  }

  throw new Error(`Database failed to become accessible within ${timeoutSeconds} seconds`);
}

// Function to start docker compose
async function startDockerCompose(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting docker compose...');
    
    // First stop any existing containers
    try {
      execSync('docker compose stop', { cwd: projectRoot, stdio: 'inherit' });
    } catch (error) {
      // Ignore errors from stop command
    }

    // Start docker compose
    const dockerProcess = spawn('docker', ['compose', 'up', '-d'], {
      cwd: projectRoot,
      stdio: 'inherit'
    });

    dockerProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Docker compose exited with code ${code}`));
      }
    });

    dockerProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// Function to wait for electric service to be ready
async function waitForElectricReady(timeoutSeconds: number = 180): Promise<void> {
  console.log('⏳ Waiting for electric service to be ready...');
  
  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;

  while (Date.now() - startTime < timeoutMs) {
    if (isElectricRunning()) {
      console.log('⚡ Electric service is now running!');
      return;
    }
    
    // Wait 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(`Electric service failed to start within ${timeoutSeconds} seconds`);
}

// Main function
async function main(): Promise<void> {
  try {
    // Check if docker-compose.yml exists
    const dockerComposeFile = join(projectRoot, 'docker-compose.yml');
    if (!existsSync(dockerComposeFile)) {
      throw new Error(`docker-compose.yml not found at ${dockerComposeFile}`);
    }

    console.log('🔍 Checking system status...');

    // Check if database is accessible
    if (!isDatabaseRunning()) {
      console.log('🔌 Database not accessible. Please ensure PostgreSQL is running on port 54322');
      console.log('💡 You may need to start your local Supabase or PostgreSQL instance first');
      process.exit(1);
    }
    console.log('✅ Database is accessible!');

    // Check if electric is already running
    if (isElectricRunning()) {
      console.log('✅ Electric service is already running!');
      return;
    }

    console.log('🔌 Electric service not running. Starting docker-compose...');
    
    // Start docker compose
    await startDockerCompose();
    
    // Wait for database to be ready (in case it was just started)
    await waitForDatabaseReady();
    
    // Wait for service to be ready
    await waitForElectricReady();
    
    console.log('🎉 Electric service started successfully!');
    console.log('🌟 All systems are go!');
  } catch (error) {
    console.error('💥 Error starting electric service:', error);
    process.exit(1);
  }
}

// Run the main function
main();
