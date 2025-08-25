import { SANDBOX_KEYS, getSecret } from '@buster/secrets';
import type { Sandbox } from '@daytonaio/sdk';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSandbox } from '../management/create-sandbox';
import { runTypescript } from './run-typescript';

describe('runTypescript integration test', () => {
  let hasApiKey: boolean;
  let sandbox: Sandbox;

  beforeAll(async () => {
    try {
      await getSecret(SANDBOX_KEYS.DAYTONA_API_KEY);
      hasApiKey = true;
    } catch {
      hasApiKey = false;
    }

    if (!hasApiKey) return;

    // Create a sandbox for the tests
    sandbox = await createSandbox({
      language: 'typescript',
    });
  }, 30000); // 30 second timeout for sandbox creation

  afterAll(async () => {
    // Clean up the sandbox
    if (sandbox) {
      await sandbox.delete();
    }
  });

  it.skipIf(!hasApiKey)('should execute TypeScript code and return "Hello, Buster"', async () => {
    const code = `console.log("Hello, Buster");`;

    const result = await runTypescript(sandbox, code);

    expect(result.result).toBe('Hello, Buster\n');
    expect(result.exitCode).toBe(0);
  });

  it.skipIf(!hasApiKey)('should handle TypeScript code with arguments', async () => {
    const code = `
      const name = process.argv[2] || "World";
      console.log(\`Hello, \${name}\`);
    `;

    const result = await runTypescript(sandbox, code, {
      argv: ['Buster'],
    });

    expect(result.result).toBe('Hello, Buster\n');
    expect(result.exitCode).toBe(0);
  });

  it.skipIf(!hasApiKey)('should handle TypeScript code with environment variables', async () => {
    const code = `
      const greeting = process.env.GREETING || "Hello";
      console.log(\`\${greeting}, Buster\`);
    `;

    const result = await runTypescript(sandbox, code, {
      env: { GREETING: 'Welcome' },
    });

    expect(result.result).toBe('Welcome, Buster\n');
    expect(result.exitCode).toBe(0);
  });

  it.skipIf(!hasApiKey)('should handle TypeScript syntax correctly', async () => {
    const code = `
      function greet(name: string): string {
        return \`Hello, \${name}\`;
      }
      
      console.log(greet("Buster"));
    `;

    const result = await runTypescript(sandbox, code);

    expect(result.result).toBe('Hello, Buster\n');
    expect(result.exitCode).toBe(0);
  });

  it.skipIf(!hasApiKey)('should create a file and confirm its existence', async () => {
    const code = `
      import * as fs from 'fs';
      import * as path from 'path';
      
      const filePath = path.join(process.cwd(), 'test-file.txt');
      const content = 'Hello from Buster sandbox!';
      
      fs.writeFileSync(filePath, content);
      console.log(\`File created at: \${filePath}\`);
      console.log(\`File exists: \${fs.existsSync(filePath)}\`);
    `;

    const result = await runTypescript(sandbox, code);

    // Check the execution was successful
    expect(result.exitCode).toBe(0);
    expect(result.result).toContain('File created at:');
    expect(result.result).toContain('File exists: true');

    // Now verify the file actually exists in the sandbox by running another command
    const verifyCode = `
      import * as fs from 'fs';
      import * as path from 'path';
      
      const filePath = path.join(process.cwd(), 'test-file.txt');
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        console.log(\`File exists: true\`);
        console.log(\`Content: \${content}\`);
      } else {
        console.log('File exists: false');
      }
    `;

    const verifyResult = await runTypescript(sandbox, verifyCode);

    expect(verifyResult.exitCode).toBe(0);
    expect(verifyResult.result).toContain('File exists: true');
    expect(verifyResult.result).toContain('Content: Hello from Buster sandbox!');
  });
});
