import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createBusterSDK } from '@buster/sdk';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import { useEffect, useState } from 'react';
import { BusterBanner } from '../../components/banner';
import { type Credentials, getCredentials, saveCredentials } from '../../utils/credentials';

interface InitProps {
  apiKey?: string;
  host?: string;
  local?: boolean;
  path?: string;
}

const DEFAULT_HOST = 'https://api2.buster.so';
const LOCAL_HOST = 'http://localhost:3001';

// Example YAML content
const BUSTER_YML_CONTENT = `# Buster configuration file
projects:
  # The name of the project
  - name: revenue

    # The name of the related data source in the Buster UI
    # Can be overridden on a per-model basis
    data_source: finance_datasource

    # The name of the database where the models are stored
    # Can be overridden on a per-model basis
    database: finance

    # The name of the schema where the models are stored
    # Can be overridden on a per-model basis
    schema: revenue

    # Include patterns for model files (relative to buster.yml)
    include:
      - "docs/revenue/*.yml"

    # Exclude patterns for files to skip (optional)
    exclude:
      - "docs/revenue/super-secret.yml"

  # You can define multiple projects for different environments
  - name: sales
    data_source: sales_datasource
    schema: sales
    database: sales
    include:
      - "docs/sales/*.yml"
`;

const SALES_LEADS_CONTENT = `name: leads
description: Sales lead tracking and pipeline management
data_source_name: my_datasource
schema: public
database: main

dimensions:
  - name: lead_id
    description: Unique identifier for the lead
    type: string
    searchable: true
  
  - name: company_name
    description: Name of the company
    type: string
    searchable: true
  
  - name: contact_email
    description: Primary contact email
    type: string
    searchable: true
  
  - name: created_date
    description: When the lead was created
    type: timestamp
  
  - name: stage
    description: Current stage in sales pipeline
    type: string
    searchable: true
    options: ["prospecting", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]
  
  - name: lead_source
    description: Source of the lead
    type: string
    searchable: true
    options: ["website", "referral", "event", "cold_call", "marketing"]

measures:
  - name: total_leads
    description: Count of all leads
    type: number
    expr: "COUNT(DISTINCT lead_id)"
  
  - name: qualified_leads
    description: Count of qualified leads
    type: number
    expr: "COUNT(DISTINCT CASE WHEN stage IN ('qualified', 'proposal', 'negotiation', 'closed_won') THEN lead_id END)"
  
  - name: pipeline_value
    description: Total pipeline value
    type: number
    expr: "SUM(estimated_value)"

metrics:
  - name: conversion_rate
    expr: "(COUNT(CASE WHEN stage = 'closed_won' THEN 1 END) / NULLIF(total_leads, 0)) * 100"
    description: Percentage of leads that convert to customers
  
  - name: average_deal_size
    expr: "pipeline_value / NULLIF(qualified_leads, 0)"
    description: Average value per qualified lead
`;

const SALES_OPPORTUNITIES_CONTENT = `name: opportunities
description: Sales opportunities and deals
data_source_name: my_datasource
schema: public
database: main

dimensions:
  - name: opportunity_id
    description: Unique opportunity identifier
    type: string
    searchable: true
  
  - name: account_name
    description: Name of the account
    type: string
    searchable: true
  
  - name: close_date
    description: Expected close date
    type: timestamp
  
  - name: stage
    description: Opportunity stage
    type: string
    searchable: true
    options: ["prospecting", "qualification", "needs_analysis", "proposal", "negotiation", "closed_won", "closed_lost"]
  
  - name: sales_rep
    description: Assigned sales representative
    type: string
    searchable: true

measures:
  - name: total_opportunities
    description: Count of all opportunities
    type: number
    expr: "COUNT(DISTINCT opportunity_id)"
  
  - name: deal_value
    description: Total deal value
    type: number
    expr: "SUM(amount)"
  
  - name: won_deals
    description: Count of won deals
    type: number
    expr: "COUNT(CASE WHEN stage = 'closed_won' THEN 1 END)"

metrics:
  - name: win_rate
    expr: "(won_deals / NULLIF(COUNT(CASE WHEN stage IN ('closed_won', 'closed_lost') THEN 1 END), 0)) * 100"
    description: Percentage of closed deals that are won
  
  - name: average_deal_size
    expr: "deal_value / NULLIF(total_opportunities, 0)"
    description: Average value per opportunity
`;

const FINANCE_REVENUE_CONTENT = `name: revenue
description: Revenue tracking and analysis
data_source_name: my_datasource
schema: public
database: main

dimensions:
  - name: transaction_id
    description: Unique transaction identifier
    type: string
    searchable: true
  
  - name: transaction_date
    description: Date of the transaction
    type: timestamp
  
  - name: revenue_type
    description: Type of revenue
    type: string
    searchable: true
    options: ["subscription", "one_time", "recurring", "professional_services"]
  
  - name: product_line
    description: Product line
    type: string
    searchable: true
  
  - name: region
    description: Geographic region
    type: string
    searchable: true
    options: ["north_america", "europe", "asia_pacific", "latin_america"]

measures:
  - name: total_revenue
    description: Total revenue amount
    type: number
    expr: "SUM(amount)"
  
  - name: recurring_revenue
    description: Monthly recurring revenue
    type: number
    expr: "SUM(CASE WHEN revenue_type IN ('subscription', 'recurring') THEN amount END)"
  
  - name: transaction_count
    description: Number of transactions
    type: number
    expr: "COUNT(DISTINCT transaction_id)"

metrics:
  - name: mrr_growth
    expr: "((recurring_revenue - LAG(recurring_revenue) OVER (ORDER BY transaction_date)) / NULLIF(LAG(recurring_revenue) OVER (ORDER BY transaction_date), 0)) * 100"
    description: Month-over-month MRR growth rate
  
  - name: average_transaction_value
    expr: "total_revenue / NULLIF(transaction_count, 0)"
    description: Average revenue per transaction
`;

const FINANCE_EXPENSES_CONTENT = `name: expenses
description: Expense tracking and budget management
data_source_name: my_datasource
schema: public
database: main

dimensions:
  - name: expense_id
    description: Unique expense identifier
    type: string
    searchable: true
  
  - name: expense_date
    description: Date of the expense
    type: timestamp
  
  - name: category
    description: Expense category
    type: string
    searchable: true
    options: ["salaries", "marketing", "operations", "technology", "travel", "office", "other"]
  
  - name: department
    description: Department that incurred the expense
    type: string
    searchable: true
  
  - name: vendor
    description: Vendor or supplier
    type: string
    searchable: true

measures:
  - name: total_expenses
    description: Total expense amount
    type: number
    expr: "SUM(amount)"
  
  - name: expense_count
    description: Number of expense transactions
    type: number
    expr: "COUNT(DISTINCT expense_id)"
  
  - name: budget_allocated
    description: Total budget allocated
    type: number
    expr: "SUM(budget_amount)"

metrics:
  - name: budget_utilization
    expr: "(total_expenses / NULLIF(budget_allocated, 0)) * 100"
    description: Percentage of budget utilized
  
  - name: expense_per_employee
    expr: "total_expenses / NULLIF(employee_count, 0)"
    description: Average expense per employee
`;

// Helper function to create project structure
async function createProjectStructure(basePath: string): Promise<void> {
  const busterDir = join(basePath, 'buster');
  const docsDir = join(busterDir, 'docs');
  const revenueDir = join(docsDir, 'revenue');
  const salesDir = join(docsDir, 'sales');

  // Create directories
  await mkdir(revenueDir, { recursive: true });
  await mkdir(salesDir, { recursive: true });

  // Create files
  await writeFile(join(busterDir, 'buster.yml'), BUSTER_YML_CONTENT);
  await writeFile(join(revenueDir, 'revenue.yml'), FINANCE_REVENUE_CONTENT);
  await writeFile(join(revenueDir, 'expenses.yml'), FINANCE_EXPENSES_CONTENT);
  await writeFile(join(salesDir, 'leads.yml'), SALES_LEADS_CONTENT);
  await writeFile(join(salesDir, 'opportunities.yml'), SALES_OPPORTUNITIES_CONTENT);
}

export function InitCommand({ apiKey, host, local, path: providedPath }: InitProps) {
  const { exit } = useApp();
  const [step, setStep] = useState<
    'check' | 'prompt-auth' | 'validate' | 'save' | 'prompt-location' | 'creating' | 'done'
  >('check');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hostInput, setHostInput] = useState('');
  const [projectPath, setProjectPath] = useState(providedPath || './');
  const [error, setError] = useState<string | null>(null);
  const [finalCreds, setFinalCreds] = useState<Credentials | null>(null);

  // Check for existing credentials
  useEffect(() => {
    if (step === 'check') {
      getCredentials().then((creds) => {
        if (creds) {
          // Already have credentials, skip to location prompt
          setFinalCreds(creds);
          setStep('prompt-location');
        } else {
          // Need to authenticate first
          let targetHost = DEFAULT_HOST;
          if (local) targetHost = LOCAL_HOST;
          else if (host) targetHost = host;

          setHostInput(targetHost);
          setApiKeyInput(apiKey || '');

          // If API key provided via args, skip to validation
          if (apiKey) {
            setFinalCreds({ apiKey, apiUrl: targetHost });
            setStep('validate');
          } else {
            setStep('prompt-auth');
          }
        }
      });
    }
  }, [step, apiKey, host, local]);

  // Handle input for auth
  useInput((_input, key) => {
    if (key.return) {
      if (step === 'prompt-auth' && apiKeyInput) {
        setFinalCreds({
          apiKey: apiKeyInput,
          apiUrl: hostInput || DEFAULT_HOST,
        });
        setStep('validate');
      } else if (step === 'prompt-location') {
        setStep('creating');
      }
    }
  });

  // Validate API key
  useEffect(() => {
    if (step === 'validate' && finalCreds) {
      const sdk = createBusterSDK({
        apiKey: finalCreds.apiKey,
        apiUrl: finalCreds.apiUrl,
        timeout: 30000,
      });

      sdk.auth
        .isApiKeyValid()
        .then((valid: boolean) => {
          if (valid) {
            setStep('save');
          } else {
            setError('Invalid API key. Please check your key and try again.');
            setStep('prompt-auth');
            setApiKeyInput('');
          }
        })
        .catch((err: Error) => {
          setError(`Connection failed: ${err.message}`);
          setStep('prompt-auth');
        });
    }
  }, [step, finalCreds]);

  // Save credentials
  useEffect(() => {
    if (step === 'save' && finalCreds) {
      saveCredentials(finalCreds)
        .then(() => {
          setStep('prompt-location');
        })
        .catch((err: Error) => {
          console.error('Failed to save credentials:', err.message);
          setStep('prompt-location');
        });
    }
  }, [step, finalCreds]);

  // Create project structure
  useEffect(() => {
    if (step === 'creating') {
      const resolvedPath = resolve(projectPath);
      createProjectStructure(resolvedPath)
        .then(() => {
          setStep('done');
        })
        .catch((err: Error) => {
          setError(`Failed to create project: ${err.message}`);
          setStep('prompt-location');
        });
    }
  }, [step, projectPath]);

  // Exit after a delay when done
  useEffect(() => {
    if (step === 'done') {
      // Give time to render the success message
      const timer = setTimeout(() => {
        exit();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [step, exit]);

  // Always show the banner at the top
  return (
    <Box flexDirection='column'>
      <BusterBanner />

      {step === 'check' && (
        <Box paddingX={2}>
          <Text>
            <Spinner type='dots' /> Checking configuration...
          </Text>
        </Box>
      )}

      {step === 'prompt-auth' && (
        <Box flexDirection='column' paddingX={2}>
          <Box marginBottom={1}>
            <Text>Let's get you connected to Buster.</Text>
          </Box>

          {error && (
            <Box marginBottom={1}>
              <Text color='red'>❌ {error}</Text>
            </Box>
          )}

          {!apiKey && !host && !local && (
            <Box marginBottom={1}>
              <Text>API URL: {hostInput}</Text>
              <Text dimColor> (Press Enter to use default)</Text>
            </Box>
          )}

          <Box marginBottom={1}>
            <Text>Enter your API key: </Text>
          </Box>

          <TextInput value={apiKeyInput} onChange={setApiKeyInput} mask='*' placeholder='sk_...' />

          <Box marginTop={1}>
            <Text dimColor>Find your API key at {hostInput}/app/settings/api-keys</Text>
          </Box>

          <Box marginTop={1}>
            <Text dimColor>Press Enter to continue</Text>
          </Box>
        </Box>
      )}

      {step === 'validate' && (
        <Box paddingX={2}>
          <Text>
            <Spinner type='dots' /> Validating your API key...
          </Text>
        </Box>
      )}

      {step === 'save' && (
        <Box paddingX={2}>
          <Text>
            <Spinner type='dots' /> Saving your configuration...
          </Text>
        </Box>
      )}

      {step === 'prompt-location' && (
        <Box flexDirection='column' paddingX={2}>
          <Box marginBottom={1}>
            <Text>Where would you like to create your Buster project?</Text>
          </Box>

          {error && (
            <Box marginBottom={1}>
              <Text color='red'>❌ {error}</Text>
            </Box>
          )}

          <Box marginBottom={1}>
            <Text>Project location: </Text>
          </Box>

          <Box borderStyle='single' borderColor='#7C3AED' paddingX={1}>
            <TextInput value={projectPath} onChange={setProjectPath} placeholder='./' />
          </Box>

          <Box marginTop={1}>
            <Text dimColor>A "buster" folder will be created at this location</Text>
          </Box>

          <Box marginTop={1}>
            <Text dimColor>Press Enter to continue</Text>
          </Box>
        </Box>
      )}

      {step === 'creating' && (
        <Box paddingX={2}>
          <Text>
            <Spinner type='dots' /> Creating project structure...
          </Text>
        </Box>
      )}

      {step === 'done' && (
        <Box flexDirection='column' paddingX={2}>
          <Box marginBottom={1}>
            <Text color='green'>✅ Created example project</Text>
          </Box>

          <Box marginBottom={1}>
            <Text>Project structure:</Text>
          </Box>

          <Box flexDirection='column' marginLeft={2}>
            <Text>📁 {join(resolve(projectPath), 'buster')}/</Text>
            <Text>├── 📄 buster.yml</Text>
            <Text>└── 📁 docs/</Text>
            <Text> ├── 📁 revenue/</Text>
            <Text> │ ├── 📄 revenue.yml</Text>
            <Text> │ └── 📄 expenses.yml</Text>
            <Text> └── 📁 sales/</Text>
            <Text> ├── 📄 leads.yml</Text>
            <Text> └── 📄 opportunities.yml</Text>
          </Box>

          <Box marginTop={1} marginBottom={1}>
            <Text bold>📚 Next steps:</Text>
          </Box>

          <Box flexDirection='column' marginLeft={2}>
            <Text>1. cd {join(resolve(projectPath), 'buster')}</Text>
            <Text>2. Configure buster.yml for your data source</Text>
            <Text>3. Populate docs/ with your documentation files</Text>
            <Text>4. Run: buster deploy to push your models to Buster</Text>
          </Box>

          <Box marginTop={1}>
            <Text dimColor>For more information, visit https://docs.buster.so</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
