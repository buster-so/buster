import { Text } from 'ink';
import type { VimMode } from '../../utils/vim-mode';

interface VimStatusProps {
  vimMode?: VimMode;
  vimEnabled?: boolean;
  hideWhenAutocomplete?: boolean;
}

export function VimStatus({ vimMode, vimEnabled, hideWhenAutocomplete }: VimStatusProps) {
  if (!vimEnabled || !vimMode || hideWhenAutocomplete) {
    return <Text> </Text>; // Return empty text to maintain layout
  }

  let modeText = '';
  let modeColor = '#c4b5fd';

  switch (vimMode) {
    case 'normal':
      modeText = 'NORMAL';
      modeColor = '#60a5fa'; // blue
      break;
    case 'insert':
      modeText = 'INSERT';
      modeColor = '#86efac'; // green
      break;
    case 'visual':
      modeText = 'VISUAL';
      modeColor = '#fbbf24'; // yellow
      break;
  }

  return (
    <Text color={modeColor} bold>
      -- {modeText} --
    </Text>
  );
}
