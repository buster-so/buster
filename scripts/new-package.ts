#!/usr/bin/env bun

import { mkdir, writeFile, access, readFile } from "fs/promises";
import { join } from "path";
import { createInterface } from "readline";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Enable keypress events for readline
if (process.stdin.isTTY) {
  require('readline').emitKeypressEvents(process.stdin);
}

interface PackageConfig {
  name: string;
  type: 'package' | 'app';
  directory: string;
  packageName: string;
}

function createReadlineInterface() {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function askQuestion(rl: any, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      resolve(answer);
    });
  });
}

function askSelect(question: string, options: string[], context?: string): Promise<string> {
  return new Promise((resolve) => {
    let selectedIndex = 0;
    
    const renderOptions = () => {
      console.clear();
      console.log("🚀 Creating a new package or app\n");
      if (context) {
        console.log(context + "\n");
      }
      console.log(question);
      
      options.forEach((option, index) => {
        if (index === selectedIndex) {
          console.log(`❯ ${option}`);
        } else {
          console.log(`  ${option}`);
        }
      });
      
      console.log("\n(Use arrow keys to navigate, press Enter to select)");
    };
    
    const onKeyPress = (str: string, key: any) => {
      if (key.name === 'up' && selectedIndex > 0) {
        selectedIndex--;
        renderOptions();
      } else if (key.name === 'down' && selectedIndex < options.length - 1) {
        selectedIndex++;
        renderOptions();
      } else if (key.name === 'return') {
        process.stdin.setRawMode(false);
        process.stdin.removeListener('keypress', onKeyPress);
        process.stdin.pause();
        console.log(`\nSelected: ${options[selectedIndex]}\n`);
        resolve(options[selectedIndex]);
      }
    };
    
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('keypress', onKeyPress);
    
    renderOptions();
  });
}

async function checkPackageExists(packageName: string, type: 'package' | 'app'): Promise<boolean> {
  try {
    const baseDir = type === 'package' ? "packages" : "apps";
    const packagePath = join(process.cwd(), baseDir, packageName);
    await access(packagePath);
    return true; // Directory exists
  } catch {
    return false; // Directory doesn't exist
  }
}

async function installDependencies(config: PackageConfig) {
  try {
    await execAsync('pnpm i', { cwd: config.directory });
    console.log("✅ Dependencies installed successfully");
  } catch (error) {
    console.warn("⚠️ Warning: Failed to install dependencies. You may need to run 'pnpm i' manually.");
    console.warn(error);
  }
}

async function formatFiles(config: PackageConfig) {
  try {
    await execAsync('npx biome check --write', { cwd: config.directory });
    console.log("✅ Files formatted successfully");
  } catch (error) {
    console.warn("⚠️ Warning: Failed to format files with biome. You may need to run 'npx biome check --write' manually.");
    console.warn(error);
  }
}

async function updatePnpmWorkspace(config: PackageConfig) {
  if (config.type !== 'app') return;
  
  try {
    const workspaceFile = join(process.cwd(), 'pnpm-workspace.yaml');
    let content = await readFile(workspaceFile, 'utf-8');
    
    // Add the new app to the Applications section
    const newAppEntry = `  - 'apps/${config.name}'`;
    
    // Find the Applications section and add the new app
    const lines = content.split('\n');
    let foundAppsSection = false;
    let insertIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('# Applications')) {
        foundAppsSection = true;
        continue;
      }
      
      if (foundAppsSection && lines[i].trim().startsWith('- \'apps/')) {
        insertIndex = i;
      } else if (foundAppsSection && !lines[i].trim().startsWith('- \'apps/') && lines[i].trim() !== '') {
        break;
      }
    }
    
    if (insertIndex !== -1) {
      lines.splice(insertIndex + 1, 0, newAppEntry);
      const newContent = lines.join('\n');
      await writeFile(workspaceFile, newContent);
      console.log("✅ Updated pnpm-workspace.yaml");
    } else {
      console.warn("⚠️ Warning: Could not find Applications section in pnpm-workspace.yaml. Please add manually:");
      console.warn(`   ${newAppEntry}`);
    }
  } catch (error) {
    console.warn("⚠️ Warning: Failed to update pnpm-workspace.yaml. Please add manually:");
    console.warn(`   - 'apps/${config.name}'`);
  }
}

async function main() {
  const rl = createReadlineInterface();
  
  console.log("🚀 Creating a new package or app\n");

  // Get package name from user
  let packageName = "";
  while (!packageName) {
    const answer = await askQuestion(rl, "What should the package be called? ");
    const trimmed = answer.trim();
    
    if (!trimmed) {
      console.log("❌ Package name is required");
      continue;
    }
    
    if (!/^[a-z0-9-]+$/.test(trimmed)) {
      console.log("❌ Package name should only contain lowercase letters, numbers, and hyphens");
      continue;
    }
    
    packageName = trimmed;
  }

  // Close readline for now, we'll use select interface
  rl.close();
  
  // Get package type from user using select interface
  const context = `What should the package be called? ${packageName}`;
  const selectedType = await askSelect("Is this a 'package' or an 'app'?", ["package", "app"], context);
  const packageType = selectedType as 'package' | 'app';

  // Check if package/app already exists
  const exists = await checkPackageExists(packageName, packageType);
  if (exists) {
    const location = packageType === 'package' ? 'packages/' : 'apps/';
    console.error(`❌ ${packageType} '${packageName}' already exists in ${location} directory`);
    process.exit(1);
  }

  const baseDir = packageType === 'package' ? "packages" : "apps";
  const namePrefix = packageType === 'package' ? "@buster" : "@buster-app";

  const config: PackageConfig = {
    name: packageName,
    type: packageType,
    directory: join(process.cwd(), baseDir, packageName),
    packageName: `${namePrefix}/${packageName}`,
  };

  // Create the package directory
  await mkdir(config.directory, { recursive: true });

  console.log(`\n📁 Creating ${config.type}: ${config.packageName}`);
  console.log(`📍 Location: ${config.type === 'package' ? 'packages' : 'apps'}/${config.name}\n`);

  // Confirm before proceeding
  const confirmContext = `Creating ${config.type}: ${config.packageName}\nLocation: ${config.type === 'package' ? 'packages' : 'apps'}/${config.name}`;
  const shouldProceed = await askSelect(`Continue with ${config.type} creation?`, ["Yes", "No"], confirmContext);

  if (shouldProceed === "No") {
    console.log(`❌ ${config.type === 'package' ? 'Package' : 'App'} creation cancelled`);
    process.exit(0);
  }

  await createPackageFiles(config);
  
  // Update pnpm workspace if it's an app
  if (config.type === 'app') {
    console.log("📝 Updating pnpm-workspace.yaml...");
    await updatePnpmWorkspace(config);
  }
  
  // Install dependencies
  console.log("\n📦 Installing dependencies...");
  await installDependencies(config);
  
  // Format files with biome
  console.log("🎨 Formatting files with biome...");
  await formatFiles(config);

  console.log(`\n✅ ${config.type === 'package' ? 'Package' : 'App'} created successfully!`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. cd ${config.type === 'package' ? 'packages' : 'apps'}/${config.name}`);
  console.log(`   2. Update the env.d.ts file with your environment variables`);
  console.log(`   3. Add your source code in the src/ directory`);
  console.log(`   4. Run 'npm run build' to build the ${config.type}`);
}

async function createPackageFiles(config: PackageConfig) {
  const { name, directory } = config;

  // Create src directory
  await mkdir(join(directory, "src"), { recursive: true });
  await mkdir(join(directory, "scripts"), { recursive: true });

  // Create package.json
  const packageJson = {
    name: config.packageName,
    version: "1.0.0",
    type: "module",
    main: "dist/index.js",
    types: "dist/index.d.ts",
    exports: {
      ".": {
        types: "./dist/index.d.ts",
        default: "./dist/index.js",
      },
      "./*": {
        types: "./dist/*.d.ts",
        default: "./dist/*.js",
      },
    },
    scripts: {
      prebuild: "node scripts/validate-env.js",
      build: "tsc",
      typecheck: "tsc --noEmit",
      dev: "tsc --watch",
      lint: "biome check",
      test: "vitest run",
      "test:watch": "vitest watch",
      "test:coverage": "vitest run --coverage",
    },
    dependencies: {
      "@buster/typescript-config": "workspace:*",
      "@buster/vitest-config": "workspace:*",
      "dotenv": "^16.5.0",
    },
  };

  await writeFile(
    join(directory, "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n"
  );

  // Create env.d.ts
  const envDts = `declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      // Add your environment variables here
    }
  }
}

export {};
`;

  await writeFile(join(directory, "env.d.ts"), envDts);

  // Create tsconfig.json
  const tsconfig = {
    extends: "@buster/typescript-config/base.json",
    compilerOptions: {
      tsBuildInfoFile: "dist/.cache/tsbuildinfo.json",
      outDir: "dist",
      rootDir: "src",
    },
    include: ["src/**/*", "env.d.ts"],
    exclude: ["node_modules", "dist", "tests", "**/*.test.ts", "**/*.spec.ts"],
  };

  await writeFile(
    join(directory, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2) + "\n"
  );

  // Create biome.json
  const biomeJson = {
    $schema: "https://biomejs.dev/schemas/1.9.4/schema.json",
    extends: ["../../biome.json"],
    files: {
      include: ["src/**/*", "scripts/**/*"],
    },
  };

  await writeFile(
    join(directory, "biome.json"),
    JSON.stringify(biomeJson, null, 2) + "\n"
  );

  // Create basic index.ts file
  const indexTs = `export * from './lib/index';
`;

  await writeFile(join(directory, "src", "index.ts"), indexTs);

  // Create lib directory and basic lib file
  await mkdir(join(directory, "src", "lib"), { recursive: true });
  const libIndex = `// Export your library functions here
export const howdy = () => {
  return 'Hello from ${config.packageName}!';
};
`;

  await writeFile(join(directory, "src", "lib", "index.ts"), libIndex);

  // Create a proper validate-env.js script
  const validateEnv = `#!/usr/bin/env node

// Load environment variables from .env file
import { config } from 'dotenv';
config();

// Build-time environment validation

console.log('🔍 Validating environment variables...');

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  // Add your required environment variables here
  // DATABASE_URL: process.env.DATABASE_URL,
  // API_KEY: process.env.API_KEY,
};

let hasErrors = false;

for (const [envKey, value] of Object.entries(env)) {
  if (!value) {
    console.error(\`❌ Missing required environment variable: \${envKey}\`);
    hasErrors = true;
  } else {
    console.log(\`✅ \${envKey} is set\`);
  }
}

if (hasErrors) {
  console.error('');
  console.error('❌ Build cannot continue with missing environment variables.');
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

console.log('✅ All required environment variables are present');
`;

  await writeFile(join(directory, "scripts", "validate-env.js"), validateEnv);

  console.log("📄 Created package.json");
  console.log("📄 Created env.d.ts");
  console.log("📄 Created tsconfig.json");
  console.log("📄 Created biome.json");
  console.log("📄 Created src/index.ts");
  console.log("📄 Created src/lib/index.ts");
  console.log("📄 Created scripts/validate-env.js");
}

// Run the CLI
main().catch((error) => {
  console.error("❌ Error creating package:", error);
  process.exit(1);
});
