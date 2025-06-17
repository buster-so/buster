import type { CoreMessage } from 'ai';

/**
 * Recovery prompts to inject when specific failure patterns are detected
 */

/**
 * Prompt for when agent gets stuck in loops or repetitive behavior
 */
export function createLoopBreakingPrompt(): CoreMessage {
  return {
    role: 'user',
    content: `It seems like you might be repeating the same action. Let me help you break out of this:

1. Take a step back and assess what you've accomplished so far
2. If you're stuck on a TODO item, try a different approach or move to the next item
3. If you're unsure about something, it's okay to make reasonable assumptions and document them
4. Remember you can use the respondWithoutAnalysis tool if the request cannot be fulfilled

Please continue with a fresh perspective.`,
  };
}

/**
 * Prompt for when agent encounters data/documentation issues
 */
export function createDataIssueRecoveryPrompt(): CoreMessage {
  return {
    role: 'user',
    content: `I notice you might be having trouble with the available data or documentation. Here's what you can do:

1. Focus on what data IS available rather than what's missing
2. Make reasonable assumptions about undefined terms and document them clearly
3. Use the executeSql tool to explore the actual data structure if needed
4. If critical data is missing, use respondWithoutAnalysis to inform the user

Please proceed with what you have available.`,
  };
}

/**
 * Prompt for when agent seems confused about tools
 */
export function createToolGuidancePrompt(): CoreMessage {
  return {
    role: 'user',
    content: `Let me clarify your available tools:

- sequentialThinking: Record your thoughts and progress on TODO items
- executeSql: Explore data when terms/values aren't documented  
- submitThoughts: Submit your prep work when ALL TODO items are complete
- respondWithoutAnalysis: Use when analysis cannot be performed

Focus on using these tools in order: start with sequentialThinking, use executeSql only when needed for undefined terms, then submit your thoughts when ready.`,
  };
}

/**
 * Prompt for when agent needs to focus and complete tasks
 */
export function createFocusPrompt(): CoreMessage {
  return {
    role: 'user',
    content: `Let's focus on completing your TODO list efficiently:

1. Address each TODO item systematically in your thoughts
2. Don't overthink - make reasonable assumptions when documentation is unclear
3. Only use executeSql if you encounter completely undefined terms
4. Once all items are addressed, submit your thoughts immediately

Please continue and complete your TODO list now.`,
  };
}

/**
 * Detects error patterns and suggests appropriate recovery prompts
 */
export function detectFailurePattern(conversationHistory: CoreMessage[]): CoreMessage | null {
  const recentMessages = conversationHistory.slice(-10);
  const messageText = recentMessages
    .map((msg) => (typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)))
    .join(' ')
    .toLowerCase();

  // Detect repetitive tool usage
  const toolCalls = recentMessages.filter(
    (msg) =>
      msg.role === 'assistant' &&
      Array.isArray(msg.content) &&
      msg.content.some((part) => typeof part === 'object' && part !== null && 'type' in part && part.type === 'tool-call')
  );

  if (toolCalls.length >= 3) {
    // Check for same tool being called repeatedly
    const toolNames = toolCalls.flatMap((msg) =>
      Array.isArray(msg.content)
        ? msg.content
            .filter((part): part is { type: 'tool-call'; toolCallId: string; toolName: string; args: unknown } => 
              typeof part === 'object' && 
              part !== null && 
              'type' in part && 
              part.type === 'tool-call' && 
              'toolCallId' in part && 
              'toolName' in part && 
              'args' in part
            )
            .map((part) => part.toolName)
        : []
    );

    const uniqueTools = new Set(toolNames);
    if (toolNames.length >= 4 && uniqueTools.size <= 2) {
      return createLoopBreakingPrompt();
    }
  }

  // Detect data/documentation confusion
  if (
    messageText.includes('not found') ||
    messageText.includes('missing') ||
    messageText.includes('undefined') ||
    messageText.includes('documentation')
  ) {
    return createDataIssueRecoveryPrompt();
  }

  // Detect tool confusion
  if (
    messageText.includes('tool') &&
    (messageText.includes('available') || messageText.includes('not found'))
  ) {
    return createToolGuidancePrompt();
  }

  // Detect general unfocused behavior
  if (recentMessages.length >= 6) {
    return createFocusPrompt();
  }

  return null;
}
