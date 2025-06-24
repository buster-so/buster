#!/usr/bin/env bun

import { mkdir, writeFile, access } from "fs/promises";
import { join } from "path";
import { createInterface } from "readline";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface PackageConfig {
  name: string;
  directory: string;
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

async function checkPackageExists(packageName: string): Promise<boolean> {
  try {
    const packagePath = join(process.cwd(), "packages", packageName);
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

async function main() {
  const rl = createReadlineInterface();
  
  console.log("🚀 Creating a new package in the packages/ directory\n");

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
    
    // Check if package already exists
    const exists = await checkPackageExists(trimmed);
    if (exists) {
      console.log(`❌ Package '${trimmed}' already exists in packages/ directory`);
      continue;
    }
    
    packageName = trimmed;
  }

  const config: PackageConfig = {
    name: packageName,
    directory: join(process.cwd(), "packages", packageName),
  };

  // Create the package directory
  await mkdir(config.directory, { recursive: true });

  console.log(`\n📁 Creating package: @buster/${config.name}`);
  console.log(`📍 Location: packages/${config.name}\n`);

  // Confirm before proceeding
  const shouldProceed = await askQuestion(rl, "Continue with package creation? (y/N) ");
  rl.close();

  if (shouldProceed.toLowerCase() !== 'y' && shouldProceed.toLowerCase() !== 'yes') {
    console.log("❌ Package creation cancelled");
    process.exit(0);
  }

  await createPackageFiles(config);
  
  // Install dependencies
  console.log("\n📦 Installing dependencies...");
  await installDependencies(config);
  
  // Format files with biome
  console.log("🎨 Formatting files with biome...");
  await formatFiles(config);

  console.log("\n✅ Package created successfully!");
  console.log(`\n📋 Next steps:`);
  console.log(`   1. cd packages/${config.name}`);
  console.log(`   2. Update the env.d.ts file with your environment variables`);
  console.log(`   3. Add your source code in the src/ directory`);
  console.log(`   4. Run 'npm run build' to build the package`);
}

async function createPackageFiles(config: PackageConfig) {
  const { name, directory } = config;

  // Create src directory
  await mkdir(join(directory, "src"), { recursive: true });
  await mkdir(join(directory, "scripts"), { recursive: true });

  // Create package.json
  const packageJson = {
    name: `@buster/${name}`,
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
  return 'Hello from @buster/${name}!';
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
