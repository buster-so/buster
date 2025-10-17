import { LLMClassifierFromTemplate } from 'autoevals';
import {
  acceptableAnswersScorerPrompt,
  doneMessageMatchesSqlResultsPrompt,
  preferredAnswerScorerPrompt,
  usesExpectedPrecomputedMetricPrompt,
} from './scorer-prompts';

// Checks if the output SQL uses the precomputed metric from the expected SQL in braintrust
export const usesExpectedPrecomputedMetric = LLMClassifierFromTemplate({
  name: 'usesExpectedPrecomputedMetric',
  promptTemplate: usesExpectedPrecomputedMetricPrompt,
  choiceScores: {
    Y: 1,
    N: 0,
  },
  useCoT: true,
  model: 'gpt-4.1',
});

// Checks if the createMetrics tool call output is one of the acceptable answers from the braintrust metadata
export const acceptableAnswersScorer = LLMClassifierFromTemplate({
  name: 'acceptableAnswersScorer',
  promptTemplate: acceptableAnswersScorerPrompt,
  choiceScores: {
    Y: 1,
    N: 0,
  },
  useCoT: true,
  model: 'gpt-4.1',
});

// Checks if the createMetrics tool call output is the preferred answer from the braintrust metadata
export const preferredAnswerScorer = LLMClassifierFromTemplate({
  name: 'preferredAnswerScorer',
  promptTemplate: preferredAnswerScorerPrompt,
  choiceScores: {
    Y: 1,
    N: 0,
  },
  useCoT: true,
  model: 'gpt-4.1',
});

// Checks if the response given to the user matches the actual metric output, used to check for hallucinations or when it pulls incorrect data but lies about it
export const doneMessageMatchesSqlResults = LLMClassifierFromTemplate({
  name: 'doneMessageMatchesSqlResults',
  promptTemplate: doneMessageMatchesSqlResultsPrompt,
  choiceScores: {
    Y: 1,
    N: 0,
  },
  useCoT: true,
  model: 'gpt-4.1',
});

export const getMostRecentOutput = ({ output }: { output: any }) => {
  try {
    const messages = output;
    let latestRequestIndex = -1;

    // Iterate backwards to find the first user message that follows an assistant or tool message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        // Check if this user message follows an assistant or tool message
        if (i === 0 || messages[i - 1].role === 'assistant' || messages[i - 1].role === 'tool') {
          latestRequestIndex = i;
          break;
        }
      }
    }

    // If no valid request transition is found, return empty array
    if (latestRequestIndex === -1) {
      return [];
    }

    const mostRecentOutput = messages.slice(latestRequestIndex);

    return mostRecentOutput;
  } catch (error) {
    console.error('Error in getMostRecentOutput scorer:', error);
    return null;
  }
};

//Makes sure that the todo list has the right format
export const todoMarkdownBoxes = ({ output }: { output: any[] }) => {
  try {
    const messages = getMostRecentOutput({ output });
    const todoListMessages = messages.filter(
      (msg: any) =>
        msg.role === 'user' &&
        Array.isArray(msg.content) &&
        msg.content.some((c: any) => c.type === 'text' && c.text.includes('<todo_list>'))
    );

    const todoListMessage = todoListMessages[0];

    const todoContent = todoListMessage.content.find(
      (c: any) => c.type === 'text' && c.text.includes('<todo_list>')
    );

    const todoMatch = todoContent.text.match(/<todo_list>([\s\S]*?)<\/todo_list>/);

    const todoItems = todoMatch[1]
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0) // Include all non-empty lines for checking
      .filter((line: string) => line !== '- Below are the items on your TODO list:');

    if (todoItems.length === 0) {
      return 0; // No TODO items
    }

    let allValid = true;
    todoItems.forEach((item: string) => {
      if (!item.startsWith('[ ]')) {
        allValid = false;
      }
    });

    return allValid ? 1 : 0; // Return 1 if all items start with [ ], 0
  } catch (error) {
    console.error('Error in todoMarkdownBoxes scorer:', error);
    return null;
  }
};

//Makes sure that executeSQL is always followed by either another executeSQL or a sequentialThinking tool call
export const executeSqlFollowedByValidTool = ({ output }: { output: any }) => {
  try {
    const messages = getMostRecentOutput({ output });
    // Find all executeSql tool calls
    const executeSqlCalls = messages
      .map((msg: any, index: number) => ({
        msg,
        index,
      }))
      .filter(
        ({ msg }: { msg: any }) =>
          msg.role === 'assistant' &&
          Array.isArray(msg.content) &&
          msg.content.some((c: any) => c.type === 'tool-call' && c.toolName === 'executeSql')
      );

    // If no executeSql calls, pass by default
    if (executeSqlCalls.length === 0) {
      return 1;
    }

    for (const { index } of executeSqlCalls) {
      // Find the next assistant message with a tool call
      let nextToolIndex = index + 1;
      while (nextToolIndex < messages.length) {
        const nextMsg = messages[nextToolIndex];
        if (
          nextMsg.role === 'assistant' &&
          Array.isArray(nextMsg.content) &&
          nextMsg.content.some((c: any) => c.type === 'tool-call')
        ) {
          const nextToolCall = nextMsg.content.find((c: any) => c.type === 'tool-call');
          const nextToolName = nextToolCall?.toolName;
          // Check if the next tool is either executeSql or sequentialThinking
          if (nextToolName === 'executeSql' || nextToolName === 'sequentialThinking') {
            break;
          }
          // biome-ignore lint/style/noUselessElse: We are checking for a specific tool call
          else {
            return 0; // Fail if next tool is neither executeSql nor sequentialThinking
          }
        }
        nextToolIndex++;
      }
      // If no next tool call is found, pass (no invalid transition occurred)
    }

    return 1;
  } catch (error) {
    console.error('Error in executeSqlFollowedByValidTool scorer:', error);
    return null;
  }
};

//Makes sure the SQL field in the YML uses the block scalar format (|) so that it does not break
export const allFilesUseYmlBlockScalar = (args: { input: string; output: any }) => {
  const { output } = args;

  for (const message of output) {
    if (message.content && Array.isArray(message.content)) {
      for (const contentItem of message.content) {
        if (contentItem.type === 'tool-call' && contentItem.toolName === 'createMetricsFileTool') {
          if (contentItem?.args?.files) {
            for (const file of contentItem.args.files) {
              const yml = file.yml_content;
              if (yml.includes('sql') && !yml.includes('sql: |')) {
                return 0;
              }
            }
          }
        }
      }
    }
  }
  return 1;
};

//Makes sure that a metric is created successfully, primarily fails if there is a bug or if the model sends back a clarifying question
export const MetricCreatedSuccessfully = ({ output }: { output: any[] }) => {
  try {
    const messages = getMostRecentOutput({ output });
    const hasSuccessfulCreation = messages.some(
      (message) =>
        message.role === 'tool' &&
        Array.isArray(message.content) &&
        message.content.some(
          (toolResult) =>
            toolResult.toolName === 'createMetrics' &&
            toolResult.type === 'tool-result' &&
            toolResult.result &&
            Array.isArray(toolResult.result.files) &&
            toolResult.result.files.length > 0
        )
    );
    return hasSuccessfulCreation ? 1 : 0;
  } catch (error) {
    console.error('Error in metric-creation-scorer scorer:', error);
    return null;
  }
};

//Makes sure that the timeFrame field in the YML is a string, not a number so that it does not break
export const timeFrameIsString = ({ output }: { output: any }) => {
  try {
    // Parse the output, expecting an array of messages
    const messages = getMostRecentOutput({ output });

    // Filter for createMetrics tool calls
    const createMetricsCalls = messages.filter(
      (msg: any) =>
        msg.role === 'assistant' &&
        Array.isArray(msg.content) &&
        msg.content.some((c: any) => c.type === 'tool-call' && c.toolName === 'createMetrics')
    );

    // If no createMetrics calls, pass by default
    if (createMetricsCalls.length === 0) {
      return 1;
    }

    // Check each createMetrics tool call
    for (const msg of createMetricsCalls) {
      const toolCall = msg.content.find(
        (c: any) => c.type === 'tool-call' && c.toolName === 'createMetrics'
      );
      const files = toolCall?.args?.files || [];

      for (const file of files) {
        const ymlContent = file.yml_content;
        if (!ymlContent) {
          return 0; // Fail if YML content is missing
        }

        // Extract timeFrame from YML content
        const timeFrameMatch = ymlContent.match(/timeFrame:\s*([^\n]+)/);
        if (timeFrameMatch?.[1]) {
          const timeFrame = timeFrameMatch[1].trim();
          // Check if timeFrame is a number (invalid)
          if (!Number.isNaN(Number(timeFrame))) {
            return 0; // Fail if timeFrame is a number
          }
        } else {
          return 0; // Fail if timeFrame is missing
        }
      }
    }

    // Pass if all timeFrame values are strings
    return 1;
  } catch (error) {
    console.error('Error in timeFrameIsString scorer:', error);
    return null; // Fail on any parsing or unexpected errors
  }
};

//Makes sure that there is exactly one doneTool tool call. If there is more than one, its wasting time/money, if there is none then the model broke somehow
export const exactlyOneDoneTool = ({ output }: { output: any[] }) => {
  const messages = getMostRecentOutput({ output });
  try {
    const doneToolCount = messages.filter(
      (message) =>
        message.role === 'assistant' &&
        Array.isArray(message.content) &&
        message.content.some(
          (toolCall) => toolCall.toolName === 'doneTool' && toolCall.type === 'tool-call'
        )
    ).length;
    return doneToolCount === 1 ? 1 : 0;
  } catch (error) {
    console.error('Error in exactly-one-done-tool scorer:', error);
    return null;
  }
};

//Makes sure that all metrics are created successfully. Even if it fails then rebuilds the SQL, this scorer will fail
export const NoFailureToCreateMetrics = ({ output }: { output: any[] }) => {
  try {
    const messages = getMostRecentOutput({ output });
    const hasUnsuccessfulCreation = messages.some(
      (message) =>
        message.role === 'tool' &&
        Array.isArray(message.content) &&
        message.content.some(
          (toolResult) =>
            toolResult.toolName === 'createMetrics' &&
            toolResult.type === 'tool-result' &&
            toolResult.result &&
            Array.isArray(toolResult.result.failed_files) &&
            toolResult.result.failed_files.length > 0
        )
    );
    return hasUnsuccessfulCreation ? 0 : 1;
  } catch (error) {
    console.error('Error in no-failed-creation scorer:', error);
    return null;
  }
};

//Makes sure that when multiple metrics are created, a dashboard is created for them
export const dashboardCreatedForMultipleMetrics = ({ output }: { output: any }) => {
  try {
    const messages = getMostRecentOutput({ output });

    // Check for createMetrics tool calls
    const createMetricsCalls = messages.filter(
      (msg: any) =>
        msg.role === 'assistant' &&
        Array.isArray(msg.content) &&
        msg.content.some((c: any) => c.type === 'tool-call' && c.toolName === 'createMetrics')
    );

    // If no createMetrics calls, return null
    if (createMetricsCalls.length === 0) {
      return null;
    }

    // Check if multiple metrics are created in any createMetrics call
    let hasMultipleMetrics = false;
    for (const msg of createMetricsCalls) {
      const toolCall = msg.content.find(
        (c: any) => c.type === 'tool-call' && c.toolName === 'createMetrics'
      );
      const files = toolCall?.args?.files || [];
      if (files.length > 1) {
        hasMultipleMetrics = true;
        break;
      }
    }

    // If no multiple metrics, return null
    if (!hasMultipleMetrics) {
      return null;
    }

    // Check for createDashboards tool call
    const createDashboardsCalls = messages.filter(
      (msg: any) =>
        msg.role === 'assistant' &&
        Array.isArray(msg.content) &&
        msg.content.some((c: any) => c.type === 'tool-call' && c.toolName === 'createDashboards')
    );

    // If multiple metrics exist and createDashboards call is found, return 1
    if (createDashboardsCalls.length > 0) {
      return 1;
    }

    // If multiple metrics exist but no createDashboards call, return 0
    return 0;
  } catch (error) {
    console.error('Error in dashboardCreatedForMultipleMetrics scorer:', error);
    return null;
  }
};
