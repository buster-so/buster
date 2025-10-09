import { Text } from 'ink';
import { UI_CONSTANTS } from '../../constants/ui';

interface ContentLinesProps {
  lines: string[];
  color?: string;
}

/**
 * Shared component for rendering lines of content
 * Provides consistent text styling
 */
export function ContentLines({
  lines,
  color = UI_CONSTANTS.COLORS.TEXT_PRIMARY,
}: ContentLinesProps) {
  return (
    <>
      {lines.map((line, idx) => (
        <Text key={idx} color={color}>
          {line}
        </Text>
      ))}
    </>
  );
}
