import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, inArray } from 'drizzle-orm';
import type { SeedConfig, SeedResult } from '../index.js';
// Import your schema tables here
// import { users, organizations, teams, dashboards } from '../../schema.js';

export const config: SeedConfig = {
  name: 'advanced-seed-template',
  description: 'Template for creating complex seed data with relationships',
  dependencies: ['basic-seed-template'], // This seed depends on basic seed
  tables: ['users', 'organizations', 'teams', 'dashboards'],
};

export async function seed(db: PostgresJsDatabase): Promise<SeedResult> {
  console.log('🌱 Running advanced seed template');

  const recordsCreated = 0;

  try {
    // Example: Bulk insert with relationships
    /*
    // Get existing organization
    const [organization] = await db.select().from(organizations).limit(1);
    if (!organization) {
      throw new Error('No organization found. Run basic seed first.');
    }

    // Create teams in bulk
    const teamsData = [
      {
        name: 'Engineering Team',
        organizationId: organization.id,
        sharingSetting: 'team' as const,
        createdBy: organization.id, // You'd use a real user ID here
      },
      {
        name: 'Marketing Team', 
        organizationId: organization.id,
        sharingSetting: 'team' as const,
        createdBy: organization.id,
      },
      {
        name: 'Sales Team',
        organizationId: organization.id,
        sharingSetting: 'organization' as const,
        createdBy: organization.id,
      }
    ];

    // Check which teams already exist
    const existingTeams = await db.select()
      .from(teams)
      .where(inArray(teams.name, teamsData.map(t => t.name)));
    
    const existingTeamNames = new Set(existingTeams.map(t => t.name));
    const newTeams = teamsData.filter(t => !existingTeamNames.has(t.name));

    if (newTeams.length > 0) {
      const insertedTeams = await db.insert(teams).values(newTeams).returning();
      recordsCreated += insertedTeams.length;
    }

    // Create dashboards for each team
    const allTeams = await db.select().from(teams).where(eq(teams.organizationId, organization.id));
    
    for (const team of allTeams) {
      const dashboardName = `${team.name} Dashboard`;
      
      const existingDashboard = await db.select()
        .from(dashboards)
        .where(eq(dashboards.name, dashboardName))
        .limit(1);

      if (existingDashboard.length === 0) {
        await db.insert(dashboards).values({
          name: dashboardName,
          description: `Dashboard for ${team.name}`,
          config: {
            layout: 'grid',
            widgets: []
          },
          organizationId: organization.id,
          createdBy: team.createdBy,
          updatedBy: team.createdBy,
        });
        recordsCreated++;
      }
    }

    // Example: Conditional seeding based on environment
    if (process.env.NODE_ENV === 'development') {
      // Create additional test data only in development
      const testUsers = Array.from({ length: 10 }, (_, i) => ({
        email: `test-user-${i + 1}@example.com`,
        name: `Test User ${i + 1}`,
        organizationId: organization.id,
        // Add other required fields
      }));

      for (const userData of testUsers) {
        const existingUser = await db.select()
          .from(users)
          .where(eq(users.email, userData.email))
          .limit(1);
        
        if (existingUser.length === 0) {
          await db.insert(users).values(userData);
          recordsCreated++;
        }
      }
    }
    */

    return {
      name: config.name,
      success: true,
      duration: 0, // Will be set by runner
      recordsCreated,
    };
  } catch (error) {
    throw new Error(`Failed to run advanced seed: ${error}`);
  }
}
