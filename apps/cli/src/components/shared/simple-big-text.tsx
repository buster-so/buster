import { Text } from 'ink';

interface SimpleBigTextProps {
  text: string;
  color?: string;
}

/**
 * Simple big text renderer that doesn't require external font files
 * Uses inline ASCII art for each letter
 */
export function SimpleBigText({ text, color = 'white' }: SimpleBigTextProps) {
  const letters: Record<string, string[]> = {
    B: ['██████╗ ', '██╔══██╗', '██████╔╝', '██╔══██╗', '██████╔╝', '╚═════╝ '],
    U: ['██╗   ██╗', '██║   ██║', '██║   ██║', '██║   ██║', '╚██████╔╝', ' ╚═════╝ '],
    S: ['███████╗', '██╔════╝', '███████╗', '╚════██║', '███████║', '╚══════╝'],
    T: ['████████╗', '╚══██╔══╝', '   ██║   ', '   ██║   ', '   ██║   ', '   ╚═╝   '],
    E: ['███████╗', '██╔════╝', '█████╗  ', '██╔══╝  ', '███████╗', '╚══════╝'],
    R: ['██████╗ ', '██╔══██╗', '██████╔╝', '██╔══██╗', '██║  ██║', '╚═╝  ╚═╝'],
  };

  // Convert text to uppercase and get the ASCII art for each letter
  const upperText = text.toUpperCase();
  const lines: string[] = ['', '', '', '', '', ''];

  for (const char of upperText) {
    const letter = letters[char];
    if (letter) {
      for (let i = 0; i < 6; i++) {
        lines[i] += `${letter[i]} `;
      }
    } else if (char === ' ') {
      for (let i = 0; i < 6; i++) {
        lines[i] += '    ';
      }
    }
  }

  return <Text color={color}>{lines.join('\n')}</Text>;
}
