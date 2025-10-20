import { dump as yamlDump } from 'js-yaml';
import { z } from 'zod';

// Outputs (exact dbt "outputs" object per adapter)
const PostgresOutputSchema = z.object({
  type: z.literal('postgres'),
  host: z.string(),
  user: z.string(),
  password: z.string(),
  port: z.number(),
  dbname: z.string(),
  schema: z.string(),
  threads: z.number(),
});
type PostgresOutput = z.infer<typeof PostgresOutputSchema>;

const SnowflakeOutputSchema = z.object({
  type: z.literal('snowflake'),
  account: z.string(),
  user: z.string(),
  // one of password or private_key_path will be present
  password: z.string().optional(),
  private_key_path: z.string().optional(),
  role: z.string(),
  database: z.string(),
  warehouse: z.string(),
  schema: z.string(),
  threads: z.number(),
  client_session_keep_alive: z.boolean(),
});
type SnowflakeOutput = z.infer<typeof SnowflakeOutputSchema>;

const BigQueryOutputSchema = z.object({
  type: z.literal('bigquery'),
  method: z.union([z.literal('service-account'), z.literal('oauth')]),
  project: z.string(),
  dataset: z.string(),
  keyfile: z.string(),
  threads: z.number(),
});
type BigQueryOutput = z.infer<typeof BigQueryOutputSchema>;

const RedshiftOutputSchema = z.object({
  type: z.literal('redshift'),
  host: z.string(),
  user: z.string(),
  password: z.string(),
  port: z.number(),
  dbname: z.string(),
  schema: z.string(),
  sslmode: z.string().default('require'),
  threads: z.number(),
});
type RedshiftOutput = z.infer<typeof RedshiftOutputSchema>;

const DatabricksOutputSchema = z.object({
  type: z.literal('databricks'),
  host: z.string(),
  http_path: z.string(),
  token: z.string(),
  schema: z.string(),
  catalog: z.string(),
  threads: z.number(),
});
type DatabricksOutput = z.infer<typeof DatabricksOutputSchema>;

const SqlServerOutputSchema = z.object({
  type: z.literal('sqlserver'),
  driver: z.string(),
  server: z.string(),
  port: z.number(),
  user: z.string(),
  password: z.string(),
  database: z.string(),
  schema: z.string(),
  encrypt: z.boolean(),
  trust_cert: z.boolean(),
  threads: z.number(),
});
type SqlServerOutput = z.infer<typeof SqlServerOutputSchema>;

const MySqlOutputSchema = z.object({
  type: z.literal('mysql'),
  server: z.string(),
  user: z.string(),
  password: z.string(),
  port: z.number(),
  database: z.string(),
  schema: z.string(), // ignored by some adapters but safe
  threads: z.number(),
});
type MySqlOutput = z.infer<typeof MySqlOutputSchema>;

/* Map adapter → output type (compile-time) */
// type Adapter =
//   | 'postgres'
//   | 'snowflake'
//   | 'bigquery'
//   | 'redshift'
//   | 'databricks'
//   | 'sqlserver'
//   | 'mysql';


/* Credentials schemas (runtime validation) */
const PostgresCredsSchema = z.object({
  adapter: z.literal('postgres'),
  host: z.string(),
  user: z.string(),
  password: z.string(),
  dbname: z.string(),
  port: z.number().optional(),
  schema: z.string().optional(),
  threads: z.number().optional(),
});

const SnowflakeCredsSchemaBase = z.object({
  adapter: z.literal('snowflake'),
  account: z.string(),
  user: z.string(),
  password: z.string().optional(),
  private_key_path: z.string().optional(),
  role: z.string(),
  database: z.string(),
  warehouse: z.string(),
  schema: z.string(),
  threads: z.number().optional(),
});

const SnowflakeCredsSchema = SnowflakeCredsSchemaBase.refine(
  (c) => !!(c.password || c.private_key_path),
  {
    message: 'Provide either password or private_key_path for Snowflake',
  }
);

const BigQueryCredsSchema = z.object({
  adapter: z.literal('bigquery'),
  project: z.string(),
  dataset: z.string(),
  keyfile: z.string(),
  method: z.union([z.literal('service-account'), z.literal('oauth')]).optional(),
  threads: z.number().optional(),
});

const RedshiftCredsSchema = z.object({
  adapter: z.literal('redshift'),
  host: z.string(),
  user: z.string(),
  password: z.string(),
  dbname: z.string(),
  port: z.number().optional(),
  schema: z.string().optional(),
  sslmode: z.string().optional(),
  threads: z.number().optional(),
});

const DatabricksCredsSchema = z.object({
  adapter: z.literal('databricks'),
  host: z.string(),
  http_path: z.string(),
  token: z.string(),
  schema: z.string(),
  catalog: z.string().optional(),
  threads: z.number().optional(),
});

const SqlServerCredsSchema = z.object({
  adapter: z.literal('sqlserver'),
  server: z.string(),
  user: z.string(),
  password: z.string(),
  database: z.string(),
  port: z.number().optional(),
  schema: z.string().optional(),
  driver: z.string().optional(),
  encrypt: z.boolean().optional(),
  trust_cert: z.boolean().optional(),
  threads: z.number().optional(),
});

const MySqlCredsSchema = z.object({
  adapter: z.literal('mysql'),
  server: z.string(),
  user: z.string(),
  password: z.string(),
  database: z.string(),
  port: z.number().optional(),
  schema: z.string().optional(),
  threads: z.number().optional(),
});

/* Union schema - using z.union since we have a refined schema */
const CredsSchema = z.union([
  PostgresCredsSchema,
  SnowflakeCredsSchema,
  BigQueryCredsSchema,
  RedshiftCredsSchema,
  DatabricksCredsSchema,
  SqlServerCredsSchema,
  MySqlCredsSchema,
]);

export type Creds = z.infer<typeof CredsSchema>;

/** buildOutput: runtime validation per adapter, typed return per adapter */
export function buildOutput(
  creds: Creds
):
  | PostgresOutput
  | SnowflakeOutput
  | BigQueryOutput
  | RedshiftOutput
  | DatabricksOutput
  | SqlServerOutput
  | MySqlOutput {
  // Full union validation once (also narrows for the switch)
  const parsed = CredsSchema.parse(creds);

  switch (parsed.adapter) {
    case 'postgres':
      return {
        type: 'postgres',
        host: parsed.host,
        user: parsed.user,
        password: parsed.password,
        port: parsed.port ?? 5432,
        dbname: parsed.dbname,
        schema: parsed.schema ?? 'public',
        threads: parsed.threads ?? 4,
      };

    case 'snowflake':
      return {
        type: 'snowflake',
        account: parsed.account,
        user: parsed.user,
        ...(parsed.password
          ? { password: parsed.password }
          : { private_key_path: parsed.private_key_path }),
        role: parsed.role,
        database: parsed.database,
        warehouse: parsed.warehouse,
        schema: parsed.schema,
        threads: parsed.threads ?? 4,
        client_session_keep_alive: false,
      };

    case 'bigquery':
      return {
        type: 'bigquery',
        method: parsed.method ?? 'service-account',
        project: parsed.project,
        dataset: parsed.dataset,
        keyfile: parsed.keyfile,
        threads: parsed.threads ?? 4,
      };

    case 'redshift':
      return {
        type: 'redshift',
        host: parsed.host,
        user: parsed.user,
        password: parsed.password,
        port: parsed.port ?? 5439,
        dbname: parsed.dbname,
        schema: parsed.schema ?? 'public',
        sslmode: parsed.sslmode ?? 'prefer',
        threads: parsed.threads ?? 4,
      };

    case 'databricks':
      return {
        type: 'databricks',
        host: parsed.host,
        http_path: parsed.http_path,
        token: parsed.token,
        schema: parsed.schema,
        catalog: parsed.catalog ?? 'hive_metastore',
        threads: parsed.threads ?? 4,
      };

    case 'sqlserver':
      return {
        type: 'sqlserver',
        driver: parsed.driver ?? 'ODBC Driver 18 for SQL Server',
        server: parsed.server,
        port: parsed.port ?? 1433,
        user: parsed.user,
        password: parsed.password,
        database: parsed.database,
        schema: parsed.schema ?? 'dbo',
        encrypt: parsed.encrypt ?? true,
        trust_cert: parsed.trust_cert ?? true,
        threads: parsed.threads ?? 4,
      };

    case 'mysql':
      return {
        type: 'mysql',
        server: parsed.server,
        user: parsed.user,
        password: parsed.password,
        port: parsed.port ?? 3306,
        database: parsed.database,
        schema: parsed.schema ?? 'public',
        threads: parsed.threads ?? 4,
      };

    default: {
      // Exhaustive check - this should never be reached
      const _exhaustiveCheck: never = parsed;
      throw new Error(`Unsupported adapter: ${JSON.stringify(_exhaustiveCheck)}`);
    }
  }
}

/** buildProfilesYaml: returns YAML string */
export function buildProfilesYaml(args: {
  profileName: string; // must match dbt_project.yml 'profile'
  target: string;
  creds: Creds;
}): string {
  const { profileName, target, creds } = args;

  const output = buildOutput(creds);
  const root = {
    [profileName]: {
      target,
      outputs: {
        [target]: output,
      },
    },
  };

  return yamlDump(root, { noRefs: true, sortKeys: true, lineWidth: 120 });
}
