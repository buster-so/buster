import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MentionInputSuggestions } from './MentionInputSuggestions';
import type { MentionInputSuggestionsProps } from './MentionInputSuggestions.types';

const meta: Meta<typeof MentionInputSuggestions> = {
  title: 'UI/Inputs/MentionInputSuggestions',
  component: MentionInputSuggestions,
  decorators: [
    (Story) => (
      <div style={{ width: '300px', minHeight: '500px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MentionInputSuggestions>;

const items: MentionInputSuggestionsProps['suggestionItems'] = [
  ...Array.from({ length: 3 }, (_, i) => ({
    label: `Item ${i + 1}`,
    value: `item${i + 1}`,
  })),
  {
    type: 'separator',
  },
  {
    label: 'Item (disabled)',
    value: 'item-disabled',
    disabled: true,
  },
  {
    label: 'Item (loading)',
    value: 'item-loading',
    loading: true,
  },
  {
    label: 'Item do not close on select',
    value: 'asdf',
    closeOnSelect: false,
  },
];

const mentions: MentionInputSuggestionsProps['mentions'] = [
  // {
  //   trigger: '@',
  //   items: [
  //     {
  //       value: '1',
  //       label: 'BigNate',
  //     },
  //     {
  //       value: '2',
  //       label: 'ReactFan42',
  //     },
  //     {
  //       value: '3',
  //       label: 'NextJSDev',
  //     },
  //   ],
  // },
  // {
  //   trigger: '#',
  //   items: [
  //     {
  //       value: '1',
  //       label: 'My number is 1',
  //     },
  //     {
  //       value: '2',
  //       label: 'My number is 2',
  //     },
  //   ],
  // },
];

export const Default: Story = {
  args: {
    value: 'Sample text value',
    suggestionItems: items,
    mentions,
    children: <div className="bg-red-100 min-h-10">Hello</div>,
  },
};
