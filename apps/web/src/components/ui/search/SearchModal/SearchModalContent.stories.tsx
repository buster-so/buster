import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SearchModalContent } from './SearchModalContent';
import type { SearchItem } from './search-modal.types';

const meta: Meta<typeof SearchModalContent> = {
  title: 'UI/Search/SearchModalContent',
  component: SearchModalContent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockSearchItems: SearchItem[] = [
  {
    icon: '🔍',
    label: 'Search Result 1',
    secondaryLabel: 'This is a secondary label',
    value: 'result-1',
    keywords: ['search', 'result', 'example'],
    type: 'item',
  },
  {
    icon: '📄',
    label: 'Document',
    secondaryLabel: 'A document file',
    value: 'document-1',
    keywords: ['document', 'file', 'pdf'],
    type: 'item',
  },
  {
    icon: '📊',
    label: 'Dashboard',
    secondaryLabel: 'Analytics dashboard',
    value: 'dashboard-1',
    keywords: ['dashboard', 'analytics', 'charts'],
    type: 'item',
  },
  ...Array.from({ length: 10 }).map<SearchItem>((_, index) => ({
    icon: '📊',
    label: `Dashboard ${index}`,
    secondaryLabel: `Analytics dashboard ${index}`,
    value: `testing-${index}`,
    keywords: ['dashboard', 'analytics', 'charts'],
    type: 'item' as const,
  })),
];

export const Default: Story = {
  args: {
    searchItems: mockSearchItems,
    onSearchChange: fn(),
    onSelect: fn(),
    onViewSearchItem: fn(),
    defaulSearchValue: 'it',
    emptyState: 'No results found',
    placeholder: 'Search for something',
    filterContent: <div>Filter</div>,
    filterDropdownContent: <div>Filter Dropdown</div>,
  },
};
