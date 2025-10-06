import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { fn } from 'storybook/test';
import HouseIcon from '@/components/ui/icons/NucleoIconOutlined/house';
import { SearchModalContent } from './SearchModalContent';
import type { SearchItem, SearchItems } from './search-modal.types';

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
    icon: <HouseIcon />,
    label: 'Search Result 1',
    secondaryLabel: 'This is a secondary label',
    value: 'result-1',
    keywords: ['search', 'result', 'example'],
    type: 'item',
  },
  {
    icon: <HouseIcon />,
    label: 'Document',
    secondaryLabel: 'A document file',
    value: 'document-1',
    keywords: ['document', 'file', 'pdf'],
    type: 'item',
    onSelect: fn(),
  },
  {
    icon: <HouseIcon />,
    label: 'Dashboard',
    secondaryLabel: 'Analytics dashboard',
    value: 'dashboard-1',
    keywords: ['dashboard', 'analytics', 'charts'],
    type: 'item',
    onSelect: fn(),
  },
  ...Array.from({ length: 10 }).map<SearchItem>((_, index) => ({
    icon: <HouseIcon />,
    label: `Dashboard ${index}`,
    secondaryLabel: `Analytics dashboard ${index}`,
    value: `testing-${index}`,
    keywords: ['dashboard', 'analytics', 'charts'],
    type: 'item' as const,
    onSelect: fn(),
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
  render: (args) => {
    const [addInSecondaryLabel, setAddInSecondaryLabel] = useState(false);
    const [open, setOpen] = useState(false);
    const [secondaryContent, setSecondaryContent] = useState<React.ReactNode>(null);

    const onViewSearchItem = (item: SearchItem) => {
      setSecondaryContent(<div>Secondary Content {item.label}</div>);
      setOpen(true);
    };

    const searchItems: SearchItems[] = mockSearchItems.map((item) => ({
      ...item,
      secondaryLabel: !addInSecondaryLabel ? null : item.secondaryLabel,
    }));

    useHotkeys('x', () => {
      setAddInSecondaryLabel((x) => !x);
    });

    return (
      <SearchModalContent
        {...args}
        searchItems={searchItems}
        onViewSearchItem={onViewSearchItem}
        onSearchChange={() => {
          setOpen(false);
        }}
        openSecondaryContent={open}
        secondaryContent={secondaryContent}
      />
    );
  },
};
