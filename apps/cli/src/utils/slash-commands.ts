import { z } from 'zod';

// Schema for slash commands
export const SlashCommandSchema = z.object({
  name: z.string().describe('Command name without the slash'),
  description: z.string().describe('Brief description of what the command does'),
  icon: z.string().optional().describe('Optional emoji or icon for the command'),
  action: z.enum(['settings', 'help', 'clear', 'exit', 'history']).describe('Action to perform'),
});

export type SlashCommand = z.infer<typeof SlashCommandSchema>;

// Available slash commands
export const SLASH_COMMANDS: SlashCommand[] = [
  {
    name: 'settings',
    description: 'Open settings configuration',
    icon: '⚙️',
    action: 'settings',
  },
  {
    name: 'help',
    description: 'Show help and available commands',
    icon: '❓',
    action: 'help',
  },
  {
    name: 'clear',
    description: 'Clear the chat history',
    icon: '🧹',
    action: 'clear',
  },
  {
    name: 'exit',
    description: 'Exit the application',
    icon: '👋',
    action: 'exit',
  },
  {
    name: 'history',
    description: 'Browse and resume previous conversations',
    icon: '📚',
    action: 'history',
  },
];

// Search for matching commands
export function searchCommands(query: string): SlashCommand[] {
  if (!query) {
    return SLASH_COMMANDS;
  }

  const lowerQuery = query.toLowerCase();
  return SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.description.toLowerCase().includes(lowerQuery)
  );
}

// Get a specific command by name
export function getCommand(name: string): SlashCommand | undefined {
  return SLASH_COMMANDS.find((cmd) => cmd.name === name);
}
