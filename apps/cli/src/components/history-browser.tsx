import { Box, Text, useApp, useInput } from 'ink';
import { useEffect, useState } from 'react';
import type { Conversation } from '../utils/conversation-history';
import { listConversations, loadConversation } from '../utils/conversation-history';

interface HistoryBrowserProps {
  workingDirectory: string;
  onSelect: (conversation: Conversation) => void;
  onCancel: () => void;
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

export function HistoryBrowser({ workingDirectory, onSelect, onCancel }: HistoryBrowserProps) {
  const { exit } = useApp();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convos = await listConversations(workingDirectory);

        // Load each conversation to get the first user message as title
        const items: ConversationListItem[] = await Promise.all(
          convos.map(async (convo) => {
            const fullConvo = await loadConversation(convo.chatId, workingDirectory);

            // Find first user message for title
            let title = 'Untitled conversation';
            if (fullConvo?.modelMessages) {
              const firstUserMsg = fullConvo.modelMessages.find(
                (msg: any) => msg.message.kind === 'user'
              );
              if (firstUserMsg && firstUserMsg.message.kind === 'user') {
                // Truncate to first line and max 60 chars
                const content = firstUserMsg.message.content.split('\n')[0];
                title = content.length > 60 ? `${content.slice(0, 57)}...` : content;
              }
            }

            return {
              chatId: convo.chatId,
              title,
              createdAt: convo.createdAt,
              updatedAt: convo.updatedAt,
              messageCount: convo.messageCount,
              relativeTime: getRelativeTime(convo.updatedAt),
            };
          })
        );

        setConversations(items);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [workingDirectory]);

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
        loadConversation(selected.chatId, workingDirectory).then((convo) => {
          if (convo) {
            onSelect(convo);
          }
        });
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
          <Text dimColor>Loading conversations...</Text>
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
          <Text dimColor>No previous conversations found.</Text>
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
