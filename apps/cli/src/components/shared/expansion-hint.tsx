import { Box, Text } from 'ink';
import { UI_CONSTANTS } from '../../constants/ui';

interface ExpansionHintProps {
  isExpanded: boolean;
  totalLines: number;
  visibleLines: number;
}

/**
 * Shared expansion hint component
 * Shows "(Press Ctrl+O to expand/collapse)" message when content is long
 */
export function ExpansionHint({ isExpanded, totalLines, visibleLines }: ExpansionHintProps) {
  if (totalLines <= visibleLines) return null;

  const hiddenLines = totalLines - visibleLines;

  return (
    <Box paddingLeft={UI_CONSTANTS.PADDING.INDENT}>
      <Text color={UI_CONSTANTS.COLORS.TEXT_DIM} dimColor>
        {isExpanded
          ? '(Press Ctrl+O to collapse)'
          : `... +${hiddenLines} lines (Press Ctrl+O to expand)`}
      </Text>
    </Box>
  );
}
