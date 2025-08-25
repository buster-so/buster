import { AI_KEYS, getSecret } from '@buster/secrets';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { Eval, initDataset, initLogger } from 'braintrust';
import analystWorkflow, {
  type AnalystRuntimeContext,
} from '../../src/workflows/analyst-agent-workflow/analyst-workflow';

(async () => {
  initLogger({
    apiKey: await getSecret(AI_KEYS.BRAINTRUST_KEY),
    projectName: 'ANALYST-WORKFLOW',
  });
})();

const runAnalystWorkflow = async (input: string) => {
  const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
  runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
  runtimeContext.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
  runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
  runtimeContext.set('dataSourceSyntax', 'postgresql');

  const run = analystWorkflow.createRun();

  const result = await run.start({
    inputData: { prompt: input },
    runtimeContext,
  });

  return result;
};

Eval('ANALYST-WORKFLOW', {
  experimentName: 'general-vibe-check',
  data: initDataset({ project: 'ANALYST-WORKFLOW', dataset: 'Northwind 25' }),
  task: runAnalystWorkflow,
  scores: [],
  maxConcurrency: 10,
});
