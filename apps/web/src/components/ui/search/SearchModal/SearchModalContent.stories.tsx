import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { fn } from 'storybook/test';
import HouseIcon from '@/components/ui/icons/NucleoIconOutlined/house';
import { createDayjsDate } from '@/lib/date';
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

const createMockSearchItems = (includeSecondary: boolean): SearchItems[] => [
  {
    type: 'group',
    label: 'Group',
    items: [
      ...Array.from({ length: 2 }).map<SearchItem>((_, index) => ({
        type: 'item',
        icon: <HouseIcon />,
        label: `Dashboard ${index} with a super long label that will be truncated`,
        secondaryLabel: includeSecondary ? `Analytics dashboard ${index}` : undefined,
        tertiaryLabel: createDayjsDate(new Date()).format('LL'),
        value: `testing-${index}`,
      })),
    ],
  },
  {
    type: 'seperator',
  },
  {
    type: 'group',
    label: 'Group 2',
    items: [
      ...Array.from({ length: 12 }).map<SearchItem>((_, index) => ({
        type: 'item',
        icon: <HouseIcon />,
        label: `Search item ${index} with a super long label that will be truncated`,
        secondaryLabel: includeSecondary ? `Search item ${index}` : undefined,
        tertiaryLabel: createDayjsDate(new Date()).format('LL'),
        value: `testing-search-item-${index}`,
      })),
    ],
  },

  // {
  //   icon: <HouseIcon />,
  //   label: 'Search Result 1',
  //   secondaryLabel: 'This is a secondary label',
  //   tertiaryLabel: createDayjsDate(new Date()).format('LL'),
  //   value: 'result-1',
  //   keywords: ['search', 'result', 'example'],
  //   type: 'item',
  // },
  // {
  //   icon: <HouseIcon />,
  //   label: 'Document',
  //   secondaryLabel: 'A document file',
  //   tertiaryLabel: createDayjsDate(new Date()).format('LL'),
  //   value: 'document-1',
  //   keywords: ['document', 'file', 'pdf'],
  //   type: 'item',
  //   onSelect: fn(),
  // },
  // {
  //   icon: <HouseIcon />,
  //   label: 'Dashboard',
  //   secondaryLabel: 'Analytics dashboard',
  //   tertiaryLabel: createDayjsDate(new Date()).format('LL'),
  //   value: 'dashboard-1',
  //   keywords: ['dashboard', 'analytics', 'charts'],
  //   type: 'item',
  //   onSelect: fn(),
  // },
  // ...Array.from({ length: 10 }).map<SearchItem>((_, index) => ({
  //   icon: <HouseIcon />,
  //   label: `Dashboard ${index} with a super long label that will be truncated`,
  //   secondaryLabel: `Analytics dashboard ${index}`,
  //   tertiaryLabel: createDayjsDate(new Date()).format('LL'),
  //   value: `testing-${index}`,
  //   keywords: ['dashboard', 'analytics', 'charts'],
  //   type: 'item' as const,
  //   onSelect: fn(),
  // })),
];

export const Default: Story = {
  args: {
    searchItems: createMockSearchItems(false),
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
      setAddInSecondaryLabel(true);
    };

    const searchItems = createMockSearchItems(addInSecondaryLabel);

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
