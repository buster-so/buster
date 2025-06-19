#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define common workspace dependencies
const WORKSPACE_DEPS = {
  '@buster/database': 'workspace:*',
  '@buster/access-controls': 'workspace:*',
  '@buster/test-utils': 'workspace:*',
  '@buster/ai': 'workspace:*',
  '@buster/data-source': 'workspace:*',
  '@buster/stored-values': 'workspace:*',
  '@buster/rerank': 'workspace:*',
  '@buster/web-tools': 'workspace:*'
};

// Packages that commonly need database access
const DATABASE_CONSUMERS = [
  'apps/server',
  'packages/ai',
  'packages/access-controls',
  'packages/stored-values'
];

function updatePackageJson(packagePath, depsToAdd) {
  const packageJsonPath = path.join(packagePath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`Skipping ${packagePath} - no package.json found`);
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }

  let updated = false;
  for (const [dep, version] of Object.entries(depsToAdd)) {
    if (!packageJson.dependencies[dep]) {
      packageJson.dependencies[dep] = version;
      updated = true;
      console.log(`Added ${dep} to ${packagePath}`);
    }
  }

  if (updated) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  }
}

// Add database dependencies to common consumers
DATABASE_CONSUMERS.forEach(packagePath => {
  updatePackageJson(packagePath, {
    '@buster/database': WORKSPACE_DEPS['@buster/database']
  });
});

console.log('Workspace dependencies synced!'); 