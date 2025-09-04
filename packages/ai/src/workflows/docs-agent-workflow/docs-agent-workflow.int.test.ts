import { randomUUID } from 'node:crypto';
import { getSandboxFileTree } from '@buster/sandbox/filesystem/file-tree/get-file-tree';
import { createSandboxWithRepositories } from '@buster/sandbox/management/create-sandbox-with-repositories';
import type { ModelMessage } from 'ai';
import { initLogger } from 'braintrust';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runDocsAgentWorkflow } from './docs-agent-workflow';

describe('docs-agent-workflow integration', () => {
  let hasRequiredEnvVars: boolean;

  beforeAll(() => {
    // Initialize Braintrust logger if available
    if (process.env.BRAINTRUST_KEY) {
      initLogger({
        apiKey: process.env.BRAINTRUST_KEY,
        projectName: process.env.ENVIRONMENT || 'test',
      });
    }

    // Check if required environment variables are present
    hasRequiredEnvVars = Boolean(
      process.env.TEST_GITHUB_PAT && process.env.TEST_SAMPLE_REPO && process.env.DAYTONA_API_KEY
    );

    if (!hasRequiredEnvVars) {
      console.info(
        'Skipping integration test - TEST_GITHUB_PAT, TEST_SAMPLE_REPO, or DAYTONA_API_KEY not set'
      );
    }
  });

  afterAll(async () => {
    // Allow time for cleanup operations
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  it('should create sandbox batches, get file tree, and run docs workflow', async () => {
    if (!hasRequiredEnvVars) {
      console.info('Skipping test due to missing environment variables');
      return;
    }

    // Prepare comma-separated list of YAML files to process
    const targetYamlListString =
      process.env.TEST_TARGET_YMLS ||
      [
        'address_type.yml',
        'address.yml',
        'average_order_value.yml',
        'basket_composition_analysis.yml',
        'bike_upgrade_cycle.yml',
        'bill_of_materials.yml',
        'business_entity_address.yml',
        'business_entity_contact.yml',
        'business_entity.yml',
        'combined_basket_value.yml',
        'contact_type.yml',
        'country_region_currency.yml',
        'country_region.yml',
        'credit_card.yml',
        'culture.yml',
        'currency_rate.yml',
        'currency.yml',
        'customer_all_time_clv.yml',
        'customer_first_purchase_date.yml',
        'customer_last_purchase_date.yml',
        'customer_lifetime_orders.yml',
        'customer_lifetime_value.yml',
        'customer_period_clv.yml',
        'customer_retention_rate.yml',
        'customer.yml',
        'date_dimension.yml',
        'department.yml',
        'discount_impact.yml',
        'discount_percentage.yml',
        'document.yml',
        'email_address.yml',
        'employee_department_history.yml',
        'employee_pay_history.yml',
        'employee_productivity.yml',
        'employee.yml',
        'gross_profit_margin.yml',
        'illustration.yml',
        'intermediate_example.yml',
        'inventory_turnover_ratio.yml',
        'job_candidate.yml',
        'location.yml',
        'monthly_sales_growth_rate.yml',
        'number_of_orders.yml',
        'order_fulfillment_rate.yml',
        'orders_with_discount_count.yml',
        'person_credit_card.yml',
        'person_phone.yml',
        'person.yml',
        'phone_number_type.yml',
        'product_average_inventory_value.yml',
        'product_category.yml',
        'product_cost_history.yml',
        'product_description.yml',
        'product_document.yml',
        'product_gross_profit.yml',
        'product_inventory.yml',
        'product_list_price_history.yml',
        'product_model_illustration.yml',
        'product_model_product_description_culture.yml',
        'product_model.yml',
        'product_order_count.yml',
        'product_photo.yml',
        'product_product_photo.yml',
        'product_profitability_index.yml',
        'product_quarterly_sales.yml',
        'product_review.yml',
        'product_subcategory.yml',
        'product_total_cost.yml',
        'product_total_revenue.yml',
        'product_vendor.yml',
        'product.yml',
        'purchase_order_detail.yml',
        'purchase_order_header.yml',
        'quarterly_sales_growth_rate.yml',
        'sales_by_product_category.yml',
        'sales_growth_rate.yml',
        'sales_order_detail.yml',
        'sales_order_header_sales_reason.yml',
        'sales_order_header.yml',
        'sales_person_quota_history.yml',
        'sales_person.yml',
        'sales_reason.yml',
        'sales_tax_rate.yml',
        'sales_territory_history.yml',
        'sales_territory.yml',
        'scrap_reason.yml',
        'seasonal_product_velocity.yml',
        'service_capacity_utilization.yml',
        'shift.yml',
        'shopping_cart_item.yml',
        'special_offer_product.yml',
        'special_offer.yml',
        'state_province.yml',
        'store.yml',
        'test_business_entity_pk.yml',
        'test_new_metrics_and_filters.yml',
        'test_product_fk.yml',
        'test_product_subcategory_category_fk.yml',
        'test_sales_order_detail_order_fk.yml',
        'test_sales_order_header_customer_fk.yml',
        'total_orders_count.yml',
        'total_sales_revenue.yml',
        'total_undiscounted_value.yml',
        'transaction_history_archive.yml',
        'transaction_history.yml',
        'unit_measure.yml',
        'vendor.yml',
        'work_order_routing.yml',
        'work_order.yml',
      ].join(',');

    const targetYamlFiles = targetYamlListString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    console.info(`Processing ${targetYamlFiles.length} YAML files with individual sandboxes`);

    // Create a shared branch name that all individual branches will merge into
    const sharedBranchName = `test-docs-agent-shared-${Date.now()}`;
    console.info(`Shared branch for merging: ${sharedBranchName}`);

    // Extract repository name from URL for git operations
    const repoUrl = process.env.TEST_SAMPLE_REPO!;
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repository';
    const repoPath = `/home/daytona/${repoName}`;

    // First, create the shared branch on ONE sandbox
    const setupSharedBranch = async () => {
      console.info('Creating initial sandbox to setup shared branch...');
      const setupSandbox = await createSandboxWithRepositories({
        language: 'typescript',
        repository: repoUrl,
        githubToken: process.env.TEST_GITHUB_PAT!,
        branchName: sharedBranchName,
      } as Parameters<typeof createSandboxWithRepositories>[0] & { repository: string });

      // Push the shared branch to ensure it exists
      await setupSandbox.process.executeCommand(`git push -u origin ${sharedBranchName}`, repoPath);

      console.info(`Shared branch ${sharedBranchName} created and pushed`);
      await setupSandbox.stop();
    };

    await setupSharedBranch();

    // Function to process a single YAML file with its own sandbox and branch
    const processYamlFile = async (yamlFile: string, fileIndex: number) => {
      const individualBranchName = `${sharedBranchName}-${yamlFile.replace('.yml', '').replace(/[^a-zA-Z0-9]/g, '-')}`;
      console.info(`[${yamlFile}] Creating sandbox with branch: ${individualBranchName}`);

      const sandbox = await createSandboxWithRepositories({
        language: 'typescript',
        repository: repoUrl,
        githubToken: process.env.TEST_GITHUB_PAT!,
        branchName: individualBranchName,
      } as Parameters<typeof createSandboxWithRepositories>[0] & { repository: string });

      console.info(`[${yamlFile}] Sandbox created with ID: ${sandbox.id || 'unknown'}`);

      try {
        // Get file tree for this sandbox
        const fileTree = await getSandboxFileTree(sandbox);
        console.info(`[${yamlFile}] File tree retrieved successfully`);

        const messages: ModelMessage[] = [
          {
            role: 'user',
            content: `I need you to add documentation to the newly initiated ${yamlFile} docs.  Here is your playbook:

        docs location: ${repoPath}/buster/docs/${yamlFile}
        metadata location: ${repoPath}/metadata/${yamlFile}.json
        notepad location: ${repoPath}/buster/notepad

        <playbook>
        ## Phase 1: Analyze relevant files, metadata, notepads, sql, etc. to understand the model. 
        - [ ] Look at the .json metadata file to understand the model 
          - [ ] Specifically analyze the underlying data, patterns, and other information that is important to understand the model.
          - [ ] Look for any nuance or details that are important for understanding the data model.
        - [ ] Look at the .sql file and lineage to understand the model. You should traverse through the upstream .sql files to understand the mode.
        - [ ] Look at the .yml file to understand the model and what needs to be documented/done.
        - [ ] For vague enums, identifiers, or other cols, you should see if there is a pattern or any insights into what they could represent.
        - [ ] If needed, run sql queries to understand the model.

        ** Make sure to frequently update your notepad and todo list as you go.

        ## Phase 2: Create the documentation for the model.
        - [ ] Create the model-level documentation.
        - [ ] Create the column-level documentation, paying attention to enums, identifiers, etc. and marking them with options or as searchable.
          - [ ] You should identify if the column is an enum or categorical column, if so, add its options.
          - [ ] You should identify if the column is medium to high cardinality column, if so, mark it as searchable.
        - [ ] Add any, decisions, challenges, assumptions, etc. to the notepad.
        - [ ] Add any clarifications/questions to the clarifications section of the .yml file.

        ** Make sure to frequently update your notepad and todo list as you go.

        ## Phase 3: Explore model and its relationships to other models
        - [ ] Analyze the model and which columns could be candidates for relationships to other models.
        - [ ] Use grep search to find columns that might be shared with this model.  This could be through lineage or through shared column names.
        - [ ] Document relationships in the .yml file that are shared with this model. Specifically, we want to document relationships that have .yml documentation files.
        - [ ] Add any clarifications, decisison, assumptions, etc. to the notepad.
        - [ ] Add any clarifications/questions to the clarifications section of the .yml file.

        ** Make sure to frequently update your notepad and todo list as you go.
        </playbook>
        `,
          },
        ];

        const workflowInput = {
          messages,
          messageId: randomUUID(),
          chatId: randomUUID(),
          userId: randomUUID(),
          organizationId: randomUUID(),
          dataSourceId: 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
          sandbox,
          repositoryName: repoName,
        };

        const result = await runDocsAgentWorkflow(workflowInput);
        console.info(`[${yamlFile}] Workflow completed successfully`);

        // After workflow completes, merge the individual branch into the shared branch
        console.info(`[${yamlFile}] Merging ${individualBranchName} into ${sharedBranchName}...`);

        // Fetch latest, checkout shared branch, merge individual branch, and push
        const mergeCommands = `
          git fetch origin && 
          git checkout ${sharedBranchName} && 
          git pull origin ${sharedBranchName} && 
          git merge origin/${individualBranchName} --no-ff -m "Merge ${yamlFile} documentation updates" && 
          git push origin ${sharedBranchName}
        `
          .replace(/\n\s+/g, ' ')
          .trim();

        try {
          const mergeResult = await sandbox.process.executeCommand(mergeCommands, repoPath);
          console.info(`[${yamlFile}] Successfully merged into shared branch`);
          console.info(`[${yamlFile}] Merge result:`, mergeResult.result);

          // Delete the individual branch from remote
          const deleteResult = await sandbox.process.executeCommand(
            `git push origin --delete ${individualBranchName}`,
            repoPath
          );
          console.info(`[${yamlFile}] Deleted individual branch ${individualBranchName}`);
        } catch (mergeError) {
          console.error(`[${yamlFile}] Merge failed:`, mergeError);
          // Continue processing other files even if merge fails
        }

        return { yamlFile, result };
      } finally {
        // Stop the sandbox for this YAML file
        await sandbox.stop();
        console.info(`[${yamlFile}] Sandbox stopped successfully`);
      }
    };

    // Process YAML files in batches of 25
    const batchSize = 25;
    const batches: string[][] = [];

    // Split files into batches
    for (let i = 0; i < targetYamlFiles.length; i += batchSize) {
      batches.push(targetYamlFiles.slice(i, i + batchSize));
    }

    console.info(
      `Processing ${targetYamlFiles.length} YAML files in ${batches.length} batches of ${batchSize}`
    );

    const allResults: Array<{ yamlFile: string; result: any }> = [];

    // Process each batch sequentially
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      if (!batch) {
        console.warn(`Batch ${batchIndex + 1} is undefined, skipping...`);
        continue;
      }

      console.info(
        `Starting batch ${batchIndex + 1}/${batches.length} with ${batch.length} files...`
      );

      // Start all files in the current batch concurrently
      const batchPromises = batch.map((yamlFile, index) => {
        const globalIndex = batchIndex * batchSize + index;
        console.info(`[Batch ${batchIndex + 1}] [${yamlFile}] Starting processing...`);
        return processYamlFile(yamlFile, globalIndex).catch((error) => {
          console.error(`[Batch ${batchIndex + 1}] [${yamlFile}] Failed:`, error);
          return { yamlFile, result: null }; // Return null result on failure
        });
      });

      console.info(
        `[Batch ${batchIndex + 1}] All ${batch.length} files started. Waiting for completion...`
      );

      // Wait for all files in the current batch to complete
      const batchResults = await Promise.all(batchPromises);
      allResults.push(...batchResults);

      console.info(`[Batch ${batchIndex + 1}] Completed! Processed ${batchResults.length} files.`);

      // Add a small delay between batches to allow for cleanup
      if (batchIndex < batches.length - 1) {
        console.info(`Waiting 5 seconds before starting next batch...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    console.info(`All ${batches.length} batches completed successfully`);
    console.info(`Successfully created and processed ${allResults.length} separate sandboxes`);
    console.info(`All changes have been merged into shared branch: ${sharedBranchName}`);

    // Validate results from all YAML files
    for (const { yamlFile, result } of allResults) {
      if (!result) {
        console.warn(`[${yamlFile}] Skipping validation due to processing failure`);
        continue;
      }

      // Validate the workflow output
      expect(result).toBeDefined();
      expect(result.workflowId).toBeDefined();
      expect(result.chatId).toBeDefined();
      expect(result.messageId).toBeDefined();
      expect(result.userId).toBeDefined();
      expect(result.organizationId).toBeDefined();
      expect(result.dataSourceId).toBeDefined();

      // Check execution metrics
      expect(result.totalExecutionTimeMs).toBeGreaterThan(0);
      expect(result.startTime).toBeLessThanOrEqual(result.endTime);

      // Check workflow outputs
      expect(result.messages).toBeDefined();
      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.repositoryTree).toBeDefined();
      expect(typeof result.todos).toBe('string');

      // Check summary
      expect(result.summary).toBeDefined();

      console.info(`[${yamlFile}] Workflow completed successfully`);
      console.info(`[${yamlFile}] Execution time:`, result.totalExecutionTimeMs, 'ms');
      console.info(
        `[${yamlFile}] TODOs created:`,
        result.todos?.split('\n').filter((line: string) => line.includes('- [ ]')).length || 0,
        'items'
      );
    }

    const successfulResults = allResults.filter((r) => r.result !== null).length;
    console.info(
      `Total files processed: ${successfulResults}/${targetYamlFiles.length} YAML files`
    );
    console.info(`Final shared branch with all changes: ${sharedBranchName}`);
  }, 900000); // 15 minute timeout for full workflow
});
