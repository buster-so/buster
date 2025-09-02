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

  it('should create sandbox, get file tree, and run docs workflow', async () => {
    if (!hasRequiredEnvVars) {
      console.info('Skipping test due to missing environment variables');
      return;
    }

    // Prepare comma-separated list of YAML files to process concurrently
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

    console.info(
      'Running docs workflow sequentially for YAML files on single sandbox:',
      targetYamlFiles
    );

    // Create a single shared branch name for all tasks
    const sharedBranchName = `test-docs-agent-${Date.now()}`;

    // Create a single sandbox for all tasks
    console.info('Creating single sandbox for all tasks...');
    const sandbox = await createSandboxWithRepositories({
      language: 'typescript',
      repository: process.env.TEST_SAMPLE_REPO!,
      githubToken: process.env.TEST_GITHUB_PAT!,
      branchName: sharedBranchName,
    } as Parameters<typeof createSandboxWithRepositories>[0] & { repository: string });

    // Get file tree once for the shared sandbox
    const fileTree = await getSandboxFileTree(sandbox);
    console.info('File tree retrieved successfully for shared sandbox');

    const results = [];

    // Process each YAML file sequentially on the same sandbox
    for (const yamlFile of targetYamlFiles) {
      console.info(`[${yamlFile}] Starting workflow on shared sandbox...`);

      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: `I need you to add documentation to the newly initiated ${yamlFile} docs.  Here is your playboook:

        ## Phase 1: Explore Repository and Update Overview
        - [ ] Explore repo files and lineage metadata
        - [ ] Reference lineage metadata for dependencies and core entity prioritization
        - [ ] Review for completeness and thoroughness

        ## Phase 2: Identify, Verify, and Document Relationships
        - [ ] Pull historic queries to identify common joins
        - [ ] Validate frequent joins and relationships
        - [ ] Identify relationships by keywords like "id", "pk", "fk"
        - [ ] Verify each identified relationship
        - [ ] Identify self-referential relationships
        - [ ] Verify each self-referential relationship
        - [ ] Identify junction tables for many-to-many
        - [ ] Verify each many-to-many relationship
        - [ ] Document verified relationships bidirectionally in .yml files
        - [ ] Confirm all plausible relationships identified and tested
        - [ ] Confirm all verified relationships documented

        ## Phase 3: Classify Columns as Stored Value or ENUM
        - [ ] Review metadata and .sql files model-by-model
        - [ ] Identify and document Stored Value columns
        - [ ] Identify and document ENUM columns
        - [ ] Update .yml files with classifications model-by-model
        - [ ] Confirm all models were checked
        - [ ] Confirm all Stored Value columns identified correctly
        - [ ] Confirm all ENUM columns identified correctly

        ## Phase 4: Generate Model Definitions
        - [ ] Write detailed model descriptions starting with core entities, one at a time
        - [ ] Save updates to each .yml file
        - [ ] Confirm all models have descriptions
        - [ ] Review definitions for clarity to new analysts

        ## Phase 5: Generate Column Definitions
        - [ ] Write column definitions and keys, model-by-model
        - [ ] Save updates to each .yml file
        - [ ] Confirm all models were documented
        - [ ] Confirm all columns have descriptions
        - [ ] Review definitions for clarity to new analysts

        ## Phase 6: Identify and Log Clarifications
        - [ ] Assess documentation for gaps after prior phases
        - [ ] Impersonate new analyst to find missing/confusing elements
        - [ ] Impersonate user to spot unclear data request areas
        - [ ] Identify unclear key concepts or field/model distinctions
        - [ ] Log important clarification items iteratively

        ## Phase 7: Finalize and Create Pull Request
        - [ ] Review work for completeness and consistency
        - [ ] Stage changes with git
        - [ ] Push changes to branch
        - [ ] Create pull request

        The key here is that for this specific model, we want to try and cover everything we can about it. We need to document this data model better than a human. So we should look at the metadata, lineage, look at possible join columns, etc.
        `,
        },
      ];

      const workflowInput = {
        messages,
        messageId: randomUUID(),
        chatId: randomUUID(),
        userId: randomUUID(),
        organizationId: randomUUID(),
        dataSourceId: randomUUID(),
        sandbox,
      };

      const result = await runDocsAgentWorkflow(workflowInput);
      console.info(`[${yamlFile}] Workflow completed successfully on shared sandbox`);

      results.push({ yamlFile, result });
    }

    // Stop the shared sandbox after all workflows complete
    await sandbox.stop();
    console.info('Shared sandbox stopped successfully');

    for (const { yamlFile, result } of results) {
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
        result.todos?.split('\n').filter((line) => line.includes('- [ ]')).length || 0,
        'items'
      );
    }
  }, 900000); // 15 minute timeout for full workflow
});
