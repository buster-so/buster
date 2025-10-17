import { RuntimeContext } from '@mastra/core/runtime-context';
import { Eval, initDataset } from 'braintrust';
import analystWorkflow, {
  type AnalystRuntimeContext,
} from '../../src/workflows/analyst-agent-workflow/analyst-workflow';
import {
  acceptableAnswersScorer,
  allFilesUseYmlBlockScalar,
  dashboardCreatedForMultipleMetrics,
  doneMessageMatchesSqlResults,
  exactlyOneDoneTool,
  executeSqlFollowedByValidTool,
  MetricCreatedSuccessfully,
  NoFailureToCreateMetrics,
  preferredAnswerScorer,
  timeFrameIsString,
  todoMarkdownBoxes,
  usesExpectedPrecomputedMetric,
} from './scorers';

const basicSuite = [
  executeSqlFollowedByValidTool,
  MetricCreatedSuccessfully,
  exactlyOneDoneTool,
  NoFailureToCreateMetrics,
  dashboardCreatedForMultipleMetrics,
];
const formatSuite = [todoMarkdownBoxes, allFilesUseYmlBlockScalar, timeFrameIsString];
const basicLLMSuite = [doneMessageMatchesSqlResults];
const expectedSuite = [
  usesExpectedPrecomputedMetric,
  acceptableAnswersScorer,
  preferredAnswerScorer,
];

const getMetricCreation = async (input: string) => {
  const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
  runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
  runtimeContext.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
  runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
  runtimeContext.set('dataSourceSyntax', 'postgresql');
  const run = analystWorkflow.createRun();

  const response = await run.start({
    inputData: { prompt: input },
    runtimeContext,
  });

  if (response.status === 'failed') {
    throw new Error(`Workflow failed: ${response.error}`);
  }

  const formatOutputStep = response.steps['format-output'];
  if (formatOutputStep.status === 'failed') {
    throw new Error(`Format output step failed: ${formatOutputStep.error}`);
  }

  return formatOutputStep.output.conversationHistory || [];
};

Eval('development', {
  experimentName: 'Golden-Dataset-Run',
  data: initDataset({
    project: 'development',
    dataset: 'Golden-Dataset',
  }),
  task: getMetricCreation,
  scores: basicSuite.concat(basicLLMSuite).concat(expectedSuite).concat(formatSuite),
  maxConcurrency: 5,
});
