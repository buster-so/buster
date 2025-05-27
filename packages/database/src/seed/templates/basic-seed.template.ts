import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import type { SeedConfig, SeedResult } from '../index.js';
// Import your schema tables here
// import { users, organizations } from '../../schema.js';

export const config: SeedConfig = {
  name: 'basic-seed-template',
  description: 'Template for creating basic seed data',
  dependencies: [], // List any seed dependencies here
  tables: ['users', 'organizations'] // List tables this seed affects
};

export async function seed(db: PostgresJsDatabase): Promise<SeedResult> {
  console.log('🌱 Running basic seed template');
  
  const recordsCreated = 0;
  
  try {
    // Example: Create organizations first (if they don't exist)
    /*
    const existingOrg = await db.select().from(organizations).where(eq(organizations.name, 'Test Organization')).limit(1);
    
    let orgId: string;
    if (existingOrg.length === 0) {
      const [newOrg] = await db.insert(organizations).values({
        name: 'Test Organization',
        // Add other required fields
      }).returning();
      orgId = newOrg.id;
      recordsCreated++;
    } else {
      orgId = existingOrg[0].id;
    }

    // Example: Create users
    const usersToCreate = [
      {
        email: 'admin@example.com',
        name: 'Admin User',
        organizationId: orgId,
        // Add other required fields
      },
      {
        email: 'user@example.com', 
        name: 'Regular User',
        organizationId: orgId,
        // Add other required fields
      }
    ];

    for (const userData of usersToCreate) {
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
      
      if (existingUser.length === 0) {
        await db.insert(users).values(userData);
        recordsCreated++;
      }
    }
    */

    return {
      name: config.name,
      success: true,
      duration: 0, // Will be set by runner
      recordsCreated
    };
  } catch (error) {
    throw new Error(`Failed to run basic seed: ${error}`);
  }
} 