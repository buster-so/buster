import type { Preview } from '@storybook/react';

import { initialize, mswLoader } from 'msw-storybook-addon';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BusterStyleProvider } from '../src/context/BusterStyles/BusterStyles';
import { BusterAssetsProvider } from '../src/context/Assets/BusterAssetsProvider';
import '../src/styles/styles.scss';

initialize();

const preview: Preview = {
  parameters: {
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    backgrounds: {
      values: [
        // 👇 Default values
        { name: 'Dark', value: '#333' },
        { name: 'Light', value: '#FFFFFF' }
      ],
      // 👇 Specify which background is shown by default
      default: 'Light'
    }
  },
  loaders: [mswLoader],
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 0,
            staleTime: 0
          }
        }
      });
      return (
        <BusterStyleProvider>
          <QueryClientProvider client={queryClient}>
            <BusterAssetsProvider>
              <Story />
            </BusterAssetsProvider>
          </QueryClientProvider>
        </BusterStyleProvider>
      );
    }
  ]
};

export default preview;
