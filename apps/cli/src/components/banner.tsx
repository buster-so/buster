import { Box, Text } from 'ink';
import { SimpleBigText } from './simple-big-text';

interface BannerProps {
  showSubtitle?: boolean;
  inline?: boolean; // When true, removes padding for inline use
}

/**
 * Shared Buster banner component for consistent branding across CLI
 * Uses SimpleBigText to avoid font loading issues in standalone binaries
 */
export function BusterBanner({ showSubtitle = true, inline = false }: BannerProps = {}) {
  const content = (
    <>
      <Box>
        <SimpleBigText text='BUSTER' color='#7C3AED' />
      </Box>
      {showSubtitle && (
        <Box marginTop={1}>
          <Text bold>Welcome to Buster</Text>
        </Box>
      )}
    </>
  );

  // For inline mode (root command), don't add padding
  if (inline) {
    return <Box flexDirection='column'>{content}</Box>;
  }

  // For centered mode (init, deploy commands), add padding and center
  return (
    <Box paddingY={2} paddingX={2} flexDirection='column' alignItems='center'>
      {content}
    </Box>
  );
}
