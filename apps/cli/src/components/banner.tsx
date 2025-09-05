import { Box, Text } from 'ink';
import BigText from 'ink-big-text';
import React from 'react';

interface BannerProps {
  showSubtitle?: boolean;
  inline?: boolean; // When true, removes padding for inline use
}

/**
 * Shared Buster banner component for consistent branding across CLI
 */
export function BusterBanner({ showSubtitle = true, inline = false }: BannerProps = {}) {
  const content = (
    <>
      <Box>
        <Text color='#7C3AED'>
          <BigText text='BUSTER' font='block' />
        </Text>
      </Box>
      {showSubtitle && (
        <Box>
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
