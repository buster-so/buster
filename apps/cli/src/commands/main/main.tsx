import type { ModelMessage } from '@buster/ai';
import { Box, Text, useApp, useInput } from 'ink';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AgentMessageComponent,
  ChatFooter,
  ChatInput,
  ChatIntroText,
  ChatTitle,
  ChatVersionTagline,
  HistoryBrowser,
  SettingsForm,
  VimStatus,
} from '../../components';
import { ExpansionContext } from '../../hooks/use-expansion';
import type { CliAgentMessage } from '../../services';
import { runChatAgent } from '../../services';
import type { Conversation } from '../../utils/conversation-history';
import { getOrCreateSdk } from '../../utils/sdk-factory';
import { getCurrentChatId, initNewSession, setSessionChatId } from '../../utils/session';
import { getSetting } from '../../utils/settings';
import type { SlashCommand } from '../../utils/slash-commands';
import { transformModelMessagesToUI } from '../../utils/transform-messages';
import type { VimMode } from '../../utils/vim-mode';
import { getCurrentWorkingDirectory } from '../../utils/working-directory';

type AppMode = 'Planning' | 'Auto-accept' | 'None';

interface ChatHistoryEntry {
  id: number;
  value: string;
}

export function Main() {
  const { exit } = useApp();
  const [input, setInput] = useState('');
  const [_history, setHistory] = useState<ChatHistoryEntry[]>([]);
  const [messages, setMessages] = useState<CliAgentMessage[]>([]);
  const [modelMessages, setModelMessages] = useState<ModelMessage[]>([]); // Raw messages from API
  const historyCounter = useRef(0);
  const messageCounter = useRef(0);
  const [vimEnabled, setVimEnabled] = useState(() => getSetting('vimMode'));
  const [currentVimMode, setCurrentVimMode] = useState<VimMode>('insert');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('None');
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const workingDirectory = useRef(getCurrentWorkingDirectory());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Callback to update messages from agent stream
  const handleMessageUpdate = useCallback((newModelMessages: ModelMessage[]) => {
    // Store raw ModelMessage array (from API - no transformation needed)
    setModelMessages(newModelMessages);

    // Transform for UI display
    const transformedMessages = transformModelMessagesToUI(newModelMessages);

    // Update message counter to highest ID
    if (transformedMessages.length > 0) {
      messageCounter.current = Math.max(
        ...transformedMessages.map((m) => m.id),
        messageCounter.current
      );
    }

    setMessages(transformedMessages);
  }, []);

  // Initialize a fresh session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        // Always start with a fresh session
        initNewSession();
        setSessionInitialized(true);
      } catch (error) {
        console.error('Failed to initialize session:', error);
        setSessionInitialized(true); // Continue anyway
      }
    };

    initSession();
  }, []);

  useInput((value, key) => {
    if (key.ctrl && value === 'c') {
      exit();
    }

    // Abort agent execution with Escape (only when thinking, don't interfere with vim mode)
    if (key.escape && isThinking && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsThinking(false);
    }

    // Toggle expansion with Ctrl+O
    if (key.ctrl && value === 'o') {
      setIsExpanded((prev) => !prev);
    }

    // Cycle through modes with shift+tab
    if (key.shift && key.tab) {
      setAppMode((current) => {
        switch (current) {
          case 'None':
            return 'Planning';
          case 'Planning':
            return 'Auto-accept';
          case 'Auto-accept':
            return 'None';
        }
      });
    }
  });

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !sessionInitialized) {
      setInput('');
      return;
    }

    const chatId = getCurrentChatId();
    const messageId = crypto.randomUUID();
    const cwd = workingDirectory.current;
    let updatedModelMessages: ModelMessage[] = [];

    try {
      // Use raw ModelMessage array directly (from API - already in correct format)
      // For new sessions, this starts as empty array
      // For resumed sessions, this contains messages loaded from API
      const userMessage: ModelMessage = {
        role: 'user',
        content: trimmed,
      };
      updatedModelMessages = [...modelMessages, userMessage];

      // Update UI state immediately
      handleMessageUpdate(updatedModelMessages);

      // Clear input and set thinking
      setInput('');
      setIsThinking(true);

      // Get or create SDK for API-first approach
      let sdk = null;
      try {
        sdk = await getOrCreateSdk();
      } catch (error) {
        console.warn('No SDK available - some features may be limited:', error);
      }

      // Create AbortController for this agent execution
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Run agent with callback for message updates (API-first, no local file saves)
      await runChatAgent(
        {
          chatId,
          messageId,
          workingDirectory: cwd,
          abortSignal: abortController.signal,
          prompt: trimmed, // Pass the user prompt for database creation
          messages: updatedModelMessages, // Pass all messages including new user message
          sdk: sdk || undefined, // Pass SDK for API-first approach
        },
        {
          onThinkingStateChange: (thinking) => {
            setIsThinking(thinking);
          },
          onMessageUpdate: handleMessageUpdate,
          onError: (error) => {
            console.error('Agent stream error:', error);
            setIsThinking(false);
          },
          onAbort: () => {
            console.warn('Agent stream aborted');
            setIsThinking(false);
          },
        }
      );
    } catch (error) {
      // Handle abort gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        // Agent was aborted, just clear thinking state
        setIsThinking(false);
      } else {
        // Handle all other errors - log and display to user
        console.error('Error in agent execution:', error);

        // Create error message to add to conversation
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorContent = `**Error:** An error occurred during agent execution:\n\n\`\`\`\n${errorMessage}\n\`\`\`\n\nPlease try again or contact support if the issue persists.`;

        // Add error as assistant message so user sees it in the UI
        const errorModelMessage: ModelMessage = {
          role: 'assistant',
          content: errorContent,
        };

        const messagesWithError = [...updatedModelMessages, errorModelMessage];
        handleMessageUpdate(messagesWithError);

        // Note: Error state is shown in UI but not saved
        // API-first approach - messages are saved during agent execution
        setIsThinking(false);
      }
    } finally {
      // Clean up abort controller
      abortControllerRef.current = null;
      setIsThinking(false);
    }
  }, [input, sessionInitialized, modelMessages, handleMessageUpdate]);

  const handleResumeConversation = useCallback(
    async (conversation: Conversation) => {
      try {
        // Update session to use this conversation's chat ID
        setSessionChatId(conversation.chatId);

        // Use handleMessageUpdate to update state (handles transformation and counter)
        handleMessageUpdate(conversation.modelMessages);

        setShowHistory(false);
      } catch (error) {
        console.error('Failed to resume conversation:', error);
        setShowHistory(false);
      }
    },
    [handleMessageUpdate]
  );

  const handleCommandExecute = useCallback(
    (command: SlashCommand) => {
      switch (command.action) {
        case 'settings':
          setShowSettings(true);
          break;
        case 'clear':
          setHistory([]);
          break;
        case 'exit':
          exit();
          break;
        case 'history':
          setShowHistory(true);
          break;
        case 'help': {
          historyCounter.current += 1;
          const helpEntry: ChatHistoryEntry = {
            id: historyCounter.current,
            value:
              'Available commands:\n/settings - Configure app settings\n/clear - Clear chat history\n/history - Browse and resume previous conversations\n/exit - Exit the app\n/help - Show this help',
          };
          setHistory((prev) => [...prev, helpEntry].slice(-5));
          break;
        }
      }
    },
    [exit]
  );

  // Memoize message list to prevent re-renders from cursor blinking
  // MUST be before conditional returns to satisfy React's rules of hooks
  const messageList = useMemo(() => {
    return messages.map((msg) => <AgentMessageComponent key={msg.id} message={msg.message} />);
  }, [messages]);

  if (showSettings) {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={2}>
        <SettingsForm
          onClose={() => {
            setShowSettings(false);
            // Refresh vim enabled setting after settings close
            setVimEnabled(getSetting('vimMode'));
          }}
        />
      </Box>
    );
  }

  if (showHistory) {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={2}>
        <HistoryBrowser
          workingDirectory={workingDirectory.current}
          onSelect={handleResumeConversation}
          onCancel={() => setShowHistory(false)}
        />
      </Box>
    );
  }

  return (
    <ExpansionContext.Provider value={{ isExpanded }}>
      <Box flexDirection="column" paddingX={1} paddingY={2} gap={1}>
        <ChatTitle />
        <ChatVersionTagline />
        <ChatIntroText />
        <Box flexDirection="column" marginTop={1}>
          {messageList}
        </Box>
        {isThinking && (
          <Box marginLeft={2} marginTop={1}>
            <Text color="gray" italic>
              Thinking...
            </Text>
          </Box>
        )}
        <Box flexDirection="column">
          <Box height={1}>
            {appMode !== 'None' && (
              <Text color="#c4b5fd" bold>
                {appMode === 'Planning' ? 'Planning Mode' : 'Auto-accept Mode'}
              </Text>
            )}
          </Box>
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder='Try "Review the changes in my current branch"'
            onVimModeChange={setCurrentVimMode}
            onCommandExecute={handleCommandExecute}
            onAutocompleteStateChange={setIsAutocompleteOpen}
            isThinking={isThinking}
          />
          <Box justifyContent="space-between">
            <VimStatus
              vimMode={currentVimMode}
              vimEnabled={vimEnabled}
              hideWhenAutocomplete={isAutocompleteOpen}
            />
            <ChatFooter />
          </Box>
        </Box>
      </Box>
    </ExpansionContext.Provider>
  );
}
