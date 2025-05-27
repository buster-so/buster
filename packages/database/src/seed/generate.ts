#!/usr/bin/env bun

import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const TEMPLATES_DIR = './src/seed/templates';
const SEEDS_DIR = './src/seed/scripts';

interface GenerateOptions {
  name: string;
  template?: string;
  description?: string;
  tables?: string[];
  dependencies?: string[];
}

/**
 * Get available templates
 */
function getAvailableTemplates(): string[] {
  if (!existsSync(TEMPLATES_DIR)) {
    return [];
  }
  
  return readdirSync(TEMPLATES_DIR)
    .filter(file => file.endsWith('.template.ts'))
    .map(file => file.replace('.template.ts', ''));
}

/**
 * Generate a new seed script from a template
 */
export function generateSeed(options: GenerateOptions): void {
  const { name, template = 'basic-seed', description, tables = [], dependencies = [] } = options;
  
  // Validate seed name
  if (!name || !/^[a-z0-9-_]+$/.test(name)) {
    throw new Error('Seed name must contain only lowercase letters, numbers, hyphens, and underscores');
  }

  // Check if seed already exists
  const seedPath = join(SEEDS_DIR, `${name}.ts`);
  if (existsSync(seedPath)) {
    throw new Error(`Seed already exists: ${seedPath}`);
  }

  // Get template content
  const templatePath = join(TEMPLATES_DIR, `${template}.template.ts`);
  if (!existsSync(templatePath)) {
    throw new Error(`Template not found: ${template}. Available templates: ${getAvailableTemplates().join(', ')}`);
  }

  let templateContent = readFileSync(templatePath, 'utf-8');

  // Replace template placeholders
  templateContent = templateContent
    .replace(/basic-seed-template/g, name)
    .replace(/Template for creating basic seed data/g, description || `Seed script for ${name}`)
    .replace(/\['users', 'organizations'\]/g, JSON.stringify(tables))
         .replace(/dependencies: \[\]/g, `dependencies: ${JSON.stringify(dependencies)}`);

  // Write the new seed file
  writeFileSync(seedPath, templateContent);
  
  console.log(`✅ Created seed script: ${seedPath}`);
  console.log('📝 Edit the file to add your seed logic');
  console.log(`🌱 Run with: bun run seed run ${name}`);
}

/**
 * CLI interface for generating seeds
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];
  
  if (command === 'list-templates') {
    const templates = getAvailableTemplates();
    console.log('📋 Available templates:');
    if (templates.length === 0) {
      console.log('  No templates found');
    } else {
      for (const template of templates) {
        console.log(`  - ${template}`);
      }
    }
    return;
  }

  if (command === 'generate' || command === 'new') {
    const name = args[1];
    if (!name) {
      console.error('❌ Seed name is required');
      showHelp();
      process.exit(1);
    }

    const options: GenerateOptions = { name };
    
    // Parse additional options
    for (let i = 2; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--template' && args[i + 1]) {
        options.template = args[i + 1];
        i++;
      } else if (arg === '--description' && args[i + 1]) {
        options.description = args[i + 1];
        i++;
      } else if (arg === '--tables' && args[i + 1]) {
        const tables = args[i + 1];
        if (tables) {
          options.tables = tables.split(',').map(t => t.trim());
        }
        i++;
      } else if (arg === '--dependencies' && args[i + 1]) {
        const deps = args[i + 1];
        if (deps) {
          options.dependencies = deps.split(',').map(d => d.trim());
        }
        i++;
      }
    }

    try {
      generateSeed(options);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    return;
  }

  showHelp();
}

function showHelp() {
  console.log(`
🌱 Seed Generator

Usage: bun run src/seed/generate.ts <command> [options]

Commands:
  generate <name>       Generate a new seed script
  new <name>           Alias for generate
  list-templates       List available templates

Options:
  --template <name>    Template to use (default: basic-seed)
  --description <text> Description for the seed
  --tables <list>      Comma-separated list of tables this seed affects
  --dependencies <list> Comma-separated list of seed dependencies

Examples:
  bun run src/seed/generate.ts generate my-seed
  bun run src/seed/generate.ts new user-data --template advanced-seed
  bun run src/seed/generate.ts new test-data --tables users,posts --dependencies user-seed
  bun run src/seed/generate.ts list-templates
`);
}

// Run CLI if this file is executed directly
if (import.meta.main) {
  await main();
} 