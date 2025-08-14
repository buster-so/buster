import type { CoreMessage } from 'ai';

// Define the required template parameters
interface AnalysisTypeRouterTemplateParams {
  userPrompt: string;
  conversationHistory?: CoreMessage[];
}

/**
 * Formats the prompt for the analysis type router to determine
 * whether to use standard or investigation analysis mode.
 *
 * @param params - The template parameters including user prompt and optional conversation history
 * @returns The formatted prompt string for the system message
 */
export function formatAnalysisTypeRouterPrompt(params: AnalysisTypeRouterTemplateParams): string {
  const { userPrompt, conversationHistory } = params;

  // Check if we have conversation history
  const hasHistory = conversationHistory && conversationHistory.length > 0;

  // Format conversation history if present
  let historySection = '';
  if (hasHistory) {
    // Convert conversation history to a readable format
    const formattedHistory = conversationHistory
      .map((msg) => {
        const role =
          msg.role === 'user' ? 'User' : msg.role === 'assistant' ? 'Assistant' : msg.role;
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        return `${role}: ${content}`;
      })
      .join('\n');

    historySection = `\nConversation history:\n${formattedHistory}`;
  }

  return `You are a router that decides between two modes for processing user queries in a data analysis LLM: Standard and Investigation.

Standard mode is the default. Use it for common questions, building charts/dashboards, narrative reports with minor analysis, single metrics, specific reports, or when the query isn't a deep research question. It handles lightweight tasks and some analysis, but not iterative deep dives.

Investigation mode is for deep research on open-ended or vague research questions, like understanding phenomena, determining causes, or questions requiring iterative thinking, asking follow-up questions internally, and digging deeper. It's more expensive and time-consuming, so only use it when truly necessaryalways prefer Standard unless the query explicitly demands extensive, iterative investigation.

If the query is not a research question (e.g., casual like 'how are you'), use Standard. For follow-ups, consider the conversation history to see if the new query builds on prior context to require deep investigation or remains standard.

User query: ${userPrompt}${historySection}

Analyze the query${hasHistory ? ' in the context of the history' : ''} and decide the mode.

Respond only with JSON:
{
  "choice": "standard" or "investigation",
  "reasoning": "1-2 sentences explaining the decision"
}

Example:
{
  "choice": "standard",
  "reasoning": "This is a standard question about finding the MAU for a specific product. This is a simple find and report question, and does not require any investigation."
}

Output should always be in the same format as the example.
`;
}
