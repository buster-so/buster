import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { fn } from 'storybook/test';
import HouseIcon from '@/components/ui/icons/NucleoIconOutlined/house';
import { createDayjsDate } from '@/lib/date';
import { SearchModal } from './SearchModal';
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
];

export const Default: Story = {
  args: {
    searchItems: createMockSearchItems(false),
    onChangeValue: fn(),
    onSelect: fn(),
    onViewSearchItem: fn(),
    emptyState: 'No results found',
    placeholder: 'Search for something',
    filterContent: <div>Filter</div>,
    filterDropdownContent: <div>Filter Dropdown</div>,
  },
  render: (args) => {
    const [searchValue, setSearchValue] = useState('');
    const [addInSecondaryLabel, setAddInSecondaryLabel] = useState(false);
    const [open, setOpen] = useState(false);
    const [secondaryContent, setSecondaryContent] = useState<React.ReactNode>(null);
    const [loading, setLoading] = useState(false);

    const onViewSearchItem = (item: SearchItem) => {
      setSecondaryContent(<div>Secondary Content {item.label}</div>);
      setOpen(true);
      setAddInSecondaryLabel(true);
    };

    const searchItems = createMockSearchItems(addInSecondaryLabel);

    useHotkeys('x', () => {
      setAddInSecondaryLabel((x) => !x);
    });
    useHotkeys('l', () => {
      setLoading((x) => !x);
    });

    return (
      <SearchModalContent
        {...args}
        searchItems={searchItems}
        onViewSearchItem={onViewSearchItem}
        value={searchValue}
        onChangeValue={(v) => {
          setOpen(false);
          setSearchValue(v);
        }}
        openSecondaryContent={open}
        secondaryContent={secondaryContent}
        loading={loading}
      />
    );
  },
};

export const SearchModalStory: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    const [openSecondaryContent, setOpenSecondaryContent] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [addInSecondaryLabel, setAddInSecondaryLabel] = useState(false);
    const [secondaryContent, setSecondaryContent] = useState<React.ReactNode>(null);
    const [loading, setLoading] = useState(false);

    const onViewSearchItem = (item: SearchItem) => {
      setSecondaryContent(<div>Secondary Content {item.label}</div>);
      setOpen(true);
      setOpenSecondaryContent(true);
      setAddInSecondaryLabel(true);
    };

    const searchItems = createMockSearchItems(addInSecondaryLabel);

    useHotkeys('x', () => {
      setAddInSecondaryLabel((x) => !x);
    });
    useHotkeys('l', () => {
      setLoading((x) => !x);
    });

    useHotkeys(
      'o',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      },
      {
        preventDefault: true,
      }
    );

    return (
      <SearchModal
        {...args}
        searchItems={searchItems}
        onViewSearchItem={onViewSearchItem}
        value={searchValue}
        onChangeValue={(v) => {
          setOpenSecondaryContent(false);
          setSearchValue(v);
        }}
        openSecondaryContent={openSecondaryContent}
        secondaryContent={secondaryContent}
        loading={loading}
        open={open}
        onClose={() => setOpen(false)}
      />
    );
  },
};
