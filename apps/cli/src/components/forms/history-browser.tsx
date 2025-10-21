import type { BusterSDK } from '@buster/sdk';
import { Box, Text, useInput } from 'ink';
import { useEffect, useState } from 'react';
import { listConversationsFromApi, loadConversationFromApi } from '../../utils/api-conversation';
import type { Conversation } from '../../utils/conversation-history';
import { getOrCreateSdk } from '../../utils/sdk-factory';

interface HistoryBrowserProps {
  workingDirectory: string;
  onSelect: (conversation: Conversation) => void;
  onCancel: () => void;
  sdk?: BusterSDK; // Optional SDK for API operations
}

interface ConversationListItem {
  chatId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  relativeTime: string;
}

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return `${diffSecs} second${diffSecs !== 1 ? 's' : ''} ago`;
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

export function HistoryBrowser({
  workingDirectory,
  onSelect,
  onCancel,
  sdk: providedSdk,
}: HistoryBrowserProps) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        // Get or create SDK for API-first approach
        let sdk = providedSdk;
        if (!sdk) {
          try {
            sdk = await getOrCreateSdk();
          } catch {
            setError('Unable to connect to API. Please check your credentials.');
            setLoading(false);
            return;
          }
        }

        // Load conversations from API
        const convos = await listConversationsFromApi(sdk);

        // Map API response to ConversationListItem format
        const items: ConversationListItem[] = convos.map((convo) => {
          // Use chat name or first 60 chars as title
          const title = convo.name
            ? convo.name.length > 60
              ? `${convo.name.slice(0, 57)}...`
              : convo.name
            : 'Untitled conversation';

          return {
            chatId: convo.chatId,
            title,
            createdAt: convo.createdAt,
            updatedAt: convo.updatedAt,
            messageCount: 0, // API doesn't provide count, set to 0
            relativeTime: getRelativeTime(convo.updatedAt),
          };
        });

        setConversations(items);
      } catch (error) {
        console.error('Failed to load conversations:', error);
        setError('Failed to load conversations from API');
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [workingDirectory, providedSdk]);

  useInput((_input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : conversations.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev < conversations.length - 1 ? prev + 1 : 0));
    } else if (key.return && conversations.length > 0) {
      const selected = conversations[selectedIndex];
      if (selected) {
        // Load conversation from API
        (async () => {
          try {
            let sdk = providedSdk;
            if (!sdk) {
              sdk = await getOrCreateSdk();
            }

            const apiConvo = await loadConversationFromApi(selected.chatId, sdk);
            if (apiConvo) {
              // Enrich API conversation with required fields for Conversation type
              const fullConvo: Conversation = {
                ...apiConvo,
                workingDirectory,
                createdAt: selected.createdAt,
                updatedAt: selected.updatedAt,
              };
              onSelect(fullConvo);
            }
          } catch (error) {
            console.error('Failed to load conversation:', error);
          }
        })();
      }
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Text color="#c4b5fd" bold>
          Resume Session
        </Text>
        <Box marginTop={1}>
          <Text dimColor>Loading conversations from API...</Text>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Text color="#c4b5fd" bold>
          Resume Session
        </Text>
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Esc to go back</Text>
        </Box>
      </Box>
    );
  }

  if (conversations.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Text color="#c4b5fd" bold>
          Resume Session
        </Text>
        <Box marginTop={1}>
          <Text dimColor>No previous conversations found in API.</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Esc to go back</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Text color="#c4b5fd" bold>
        Resume Session
      </Text>

      <Box flexDirection="column" marginTop={1}>
        {conversations.map((convo, index) => {
          const isSelected = index === selectedIndex;

          return (
            <Box
              key={convo.chatId}
              flexDirection="column"
              marginBottom={1}
              paddingLeft={1}
              borderStyle="single"
              borderColor={isSelected ? '#c4b5fd' : 'gray'}
            >
              {/* Title */}
              <Text bold color={isSelected ? '#c4b5fd' : 'white'}>
                {convo.title}
              </Text>

              {/* Metadata */}
              <Box>
                <Text dimColor>
                  {convo.relativeTime} · {convo.messageCount} message
                  {convo.messageCount !== 1 ? 's' : ''} · docs-agent
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>↑↓ to navigate · Enter to resume · Esc to cancel</Text>
      </Box>
    </Box>
  );
}
