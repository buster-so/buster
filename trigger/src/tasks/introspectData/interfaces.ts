import { z } from 'zod';

// Zod schema for credentials (simplified for now)
export const CredentialsSchema = z
  .object({
    type: z.enum([
      'snowflake',
      'postgresql',
      'mysql',
      'bigquery',
      'sqlserver',
      'redshift',
      'databricks',
    ]),
    // Add common credential fields - can be extended later
    host: z.string().optional(),
    port: z.number().optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  })
  .passthrough(); // Allow additional fields for different credential types

// Zod schema for runtime validation
export const IntrospectDataInputSchema = z.object({
  dataSourceName: z.string().min(1, 'Data source name is required'),
  credentials: CredentialsSchema,
  options: z
    .object({
      databases: z.array(z.string()).optional(),
      schemas: z.array(z.string()).optional(),
      tables: z.array(z.string()).optional(),
    })
    .optional(),
});

export const IntrospectDataOutputSchema = z.object({
  success: z.boolean(),
  dataSourceName: z.string(),
  error: z.string().optional(),
});

// TypeScript types inferred from Zod schemas
export type IntrospectDataInput = z.infer<typeof IntrospectDataInputSchema>;
export type IntrospectDataOutput = z.infer<typeof IntrospectDataOutputSchema>;
export type Credentials = z.infer<typeof CredentialsSchema>;
