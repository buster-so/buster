import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { fn } from 'storybook/test';
import { Button } from '../buttons/Button';
import { PaintRoller, Star, Storage } from '../icons';
import { Dropdown } from './Dropdown';
import type { IDropdownItems } from './dropdown-items.types';

const meta: Meta<typeof Dropdown> = {
  title: 'UI/Dropdowns/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    align: {
      control: 'select',
      options: ['start', 'center', 'end'],
      defaultValue: 'start',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

// Basic example with simple items
export const Basic: Story = {
  args: {
    items: [
      {
        value: '1',
        label: 'Profile',
        onClick: fn(),
        loading: false,
        icon: <PaintRoller />,
      },
      {
        value: '2',
        label: 'Settings',
        onClick: fn(),
        shortcut: '⌘S',
      },
      {
        value: '3',
        label: 'Logout',
        onClick: fn(),
        items: [
          {
            value: '3-1',
            label: 'Testing 123',
          },
          {
            value: '3-2',
            label: 'Testing 456',
          },
        ],
      },
    ],
    children: <Button>Open Menu</Button>,
  },
};

// Example with icons and shortcuts
export const WithIconsAndShortcuts: Story = {
  args: {
    menuHeader: 'Menu Options',
    items: [
      {
        value: '1',
        label: 'Profile',
        icon: '👤',
        shortcut: '⌘P',
        onClick: fn(),
      },
      {
        value: '2',
        label: 'Settings',
        icon: '⚙️',
        shortcut: '⌘S',
        onClick: fn(),
      },
      {
        value: '3',
        label: 'Logout',
        icon: '🚪',
        shortcut: '⌘L',
        onClick: fn(),
      },
    ],
    children: <Button>Menu with Icons</Button>,
  },
};

// Example with nested items
export const WithNestedItems: Story = {
  args: {
    menuHeader: 'Nested Menu',
    items: [
      {
        value: '1',
        label: 'Main Options',
        items: [
          {
            value: '1-1',
            label: 'Option 1',
            onClick: fn(),
          },
          {
            value: '1-2',
            label: 'Option 2',
            onClick: fn(),
          },
        ],
      },
      {
        value: '2',
        label: 'More Options',
        items: [
          {
            value: '2-1',
            label: 'Sub Option 1',
            onClick: fn(),
          },
          {
            value: '2-2',
            label: 'Sub Option 2',
            onClick: fn(),
          },
        ],
      },
    ],
    children: <Button>Nested Menu</Button>,
  },
};

// Example with disabled items
export const WithDisabledItems: Story = {
  args: {
    items: [
      {
        value: '1',
        label: 'Available Option',
        onClick: fn(),
      },
      {
        value: '2',
        label: 'Disabled Option',
        disabled: true,
        onClick: fn(),
      },
      {
        value: '3',
        label: 'Another Available',
        onClick: fn(),
      },
    ],
    children: <Button>Menu with Disabled Items</Button>,
  },
};

// Example with custom widths
export const CustomWidth: Story = {
  args: {
    menuHeader: 'Custom Width Menu',
    items: [
      {
        value: '1',
        label: 'This is a very long menu item that might need wrapping',
        onClick: fn(),
      },
      {
        value: '2',
        label: 'Short item',
        onClick: fn(),
      },
    ],
    children: <Button>Wide Menu</Button>,
  },
};

// Example with loading state
export const WithLoadingItems: Story = {
  args: {
    items: [
      {
        value: '1',
        label: 'Normal Item',
        onClick: fn(),
      },
      {
        value: '2',
        label: 'Loading Item',
        loading: true,
        onClick: fn(),
      },
      {
        value: '3',
        label: 'Another Normal',
        onClick: fn(),
      },
      { type: 'divider' },
      {
        value: '4',
        label: 'Option 4',
        onClick: fn(),
      },
      {
        value: '5',
        label: 'Option 5',
        onClick: fn(),
      },
    ],
    children: <Button>Menu with Loading</Button>,
  },
};

// Example with selection
export const WithSelectionSingle: Story = {
  args: {
    selectType: 'single',
    items: [
      {
        value: '1',
        label: 'Option 1',
        selected: false,
        onClick: fn(),
      },
      {
        value: '2',
        label: 'Option 2',
        onClick: fn(),
      },
      {
        value: '3',
        label: 'Option 3 - Selected',
        onClick: fn(),
        selected: true,
      },
    ],
    children: <Button>Selection Menu</Button>,
  },
};

export const WithSelectionMultiple: Story = {
  render: () => {
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set(['3']));

    const items: IDropdownItems = [
      {
        value: '1',
        label: 'Option 1',
        selected: selectedIds.has('1'),
        onClick: fn(),
      },
      {
        value: '2',
        label: 'Option 2',
        selected: selectedIds.has('2'),
        onClick: fn(),
      },
      {
        value: '3',
        label: 'Option 3',
        selected: selectedIds.has('3'),
        onClick: fn(),
      },
      { type: 'divider' as const },
      {
        value: '4',
        label: 'Option 4',
        selected: selectedIds.has('4'),
        onClick: fn(),
      },
      {
        value: '5',
        label: 'Option 5',
        selected: selectedIds.has('5'),
        onClick: fn(),
      },
    ];

    const handleSelect = (itemId: string) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    };

    return (
      <Dropdown
        selectType="multiple"
        items={items}
        menuHeader={'Search items...'}
        onSelect={handleSelect}
        children={<Button>Selection Menu</Button>}
      />
    );
  },
};

// Example with secondary labels
export const WithSecondaryLabel: Story = {
  args: {
    menuHeader: 'Items with Secondary Labels',
    items: [
      {
        value: '1',
        label: 'Profile Settings',
        secondaryLabel: 'User preferences',
        onClick: fn(),
      },
      {
        value: '2',
        label: 'Storage',
        secondaryLabel: '45GB used',
        onClick: fn(),
        selected: true,
      },
      { type: 'divider' },
      {
        value: '3',
        label: 'Subscription',
        secondaryLabel: 'Pro Plan',
        onClick: fn(),
        icon: <Star />,
      },
    ],
    children: <Button>Menu with Secondary Labels</Button>,
  },
};

// Example with search header
export const WithSearchHeader: Story = {
  args: {
    menuHeader: 'Search items...',
    items: [
      {
        value: '1',
        label: 'Profile Settings',
        searchLabel: 'profile settings user preferences account',
        secondaryLabel: 'User preferences',
        onClick: fn(),
        icon: <PaintRoller />,
      },
      {
        value: '2',
        label: 'Storage Options',
        searchLabel: 'storage disk space memory',
        secondaryLabel: 'Manage storage space',
        onClick: fn(),
        icon: <Storage />,
      },
      {
        value: '3',
        label: 'Favorites',
        searchLabel: 'favorites starred items bookmarks',
        secondaryLabel: 'View starred items',
        onClick: fn(),
        icon: <Star />,
      },
      { type: 'divider' },
      {
        value: '4',
        label: 'Logout',
        onClick: fn(),
      },
      {
        value: '5',
        label: 'Invite User',
        onClick: fn(),
      },
    ],
    children: <Button>Searchable Menu</Button>,
  },
};

// Example with long text to test truncation
export const WithLongText: Story = {
  args: {
    menuHeader: 'Search items...',
    items: [
      ...Array.from({ length: 100 }).map(() => {
        const label = faker.commerce.product();
        const secondaryLabel = faker.commerce.productDescription();
        return {
          value: faker.string.uuid(),
          label,
          secondaryLabel,
          searchLabel: `${label} ${secondaryLabel}`,
          onClick: fn(),
          truncate: true,
        };
      }),
    ],
    children: <Button>Long Text Menu</Button>,
  },
};

// Example with links
export const WithLinks: Story = {
  args: {
    menuHeader: 'Navigation Links',
    items: [
      {
        value: '1',
        label: 'Documentation',
        link: '/docs',
        icon: <Storage />,
        onClick: fn(),
      },
      {
        value: '2',
        label: 'GitHub Repository',
        link: 'https://github.com/example/repo',
        icon: <Star />,
        secondaryLabel: 'External Link',
      },
      { type: 'divider' },
      {
        value: '3',
        label: 'Settings Page',
        link: '/settings',
        icon: <PaintRoller />,
      },
      {
        value: '4',
        label: 'Help Center',
        link: '/help',
        secondaryLabel: 'Get Support',
      },
    ],
    children: <Button>Menu with Links</Button>,
  },
};

export const WithManyItemsToSearch: Story = {
  args: {
    menuHeader: 'Search items...',
    items: [
      ...Array.from({ length: 100 }).map(() => {
        const product = `${faker.commerce.productAdjective()} ${faker.commerce.product()}`;
        return {
          value: `${product} ${faker.string.uuid()}`,
          label: product,
        };
      }),
    ],
    onSelect: fn(),
    children: <Button>Menu with Many Items</Button>,
  },
};

// Interactive example with links and multiple selection
export const WithLinksAndMultipleSelection: Story = {
  render: () => {
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set(['2']));

    const items: IDropdownItems = [
      {
        value: '1',
        label: 'Documentation Home',
        link: '/docs',
        selected: selectedIds.has('1'),
        icon: <Storage />,
        secondaryLabel: 'Main documentation',
      },
      {
        value: '2',
        label: 'API Reference',
        link: '/docs/api',
        selected: selectedIds.has('2'),
        icon: <Star />,
        secondaryLabel: 'API documentation',
      },
      { type: 'divider' as const },
      {
        value: '3',
        label: 'Tutorials',
        link: '/docs/tutorials',
        selected: selectedIds.has('3'),
        icon: <PaintRoller />,
        secondaryLabel: 'Learn step by step',
      },
      {
        value: '4',
        label: 'Examples',
        link: '/docs/examples',
        selected: selectedIds.has('4'),
        secondaryLabel: 'Code examples',
      },
    ];

    const handleSelect = (itemId: string) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    };

    return (
      <Dropdown
        open
        selectType="multiple"
        items={items}
        menuHeader="Search documentation..."
        onSelect={handleSelect}
        children={<Button>Documentation Sections</Button>}
      />
    );
  },
};

export const WithFooterContent: Story = {
  args: {
    items: [
      {
        value: '1',
        label: 'Option 1',
        onClick: fn(),
      },
      {
        value: '2',
        label: 'Option 2',
        onClick: fn(),
      },
      {
        value: '3',
        label: 'Option 3',
        onClick: fn(),
      },
    ],
    footerContent: (
      <Button variant={'black'} block>
        Footer Content
      </Button>
    ),
    children: <Button>Menu with Footer Content</Button>,
  },
};

export const WithFooterAndHeader: Story = {
  args: {
    ...WithFooterContent.args,
    menuHeader: 'Menu...',
  },
};

// Example with numbered items
export const WithNumberedItemsNoFilter: Story = {
  args: {
    showIndex: true,
    selectType: 'single',
    onSelect: fn(),
    items: [
      {
        value: 'value1',
        label: 'First Item',
        onClick: fn(),
        icon: <PaintRoller />,
      },
      {
        value: 'value2',
        label: 'Second Item',
        onClick: fn(),
        icon: <Star />,
      },
      { type: 'divider' },
      {
        value: 'value3',
        label: 'Third Item',
        onClick: fn(),
        icon: <Storage />,
        searchLabel: 'Third Item with secondary label',
        secondaryLabel: 'With secondary label',
      },
      {
        value: 'value4',
        label: 'Fourth Item',
        onClick: fn(),
        disabled: true,
      },
    ],
    children: <Button>Numbered Menu</Button>,
  },
};

export const WithNumberedItemsWithFilter: Story = {
  args: {
    ...{ ...WithNumberedItemsNoFilter.args },
    menuHeader: 'Search items...',
  },
};

export const WithReactNodeSubMenu: Story = {
  args: {
    children: <Button>Numbered Menu</Button>,
    items: [
      {
        label: 'Option 1',
        value: '1',
        items: [
          { label: 'Sub Option 1', value: '1-1' },
          { label: 'Sub Option 2', value: '1-2' },
        ],
      },
      {
        label: 'Option 2',
        value: '2',
        items: [
          <div key="test" className="min-w-[300px] bg-red-100">
            sasdf
          </div>,
        ],
      },
    ],
  },
};

export const WithSubMenuAndHundredItems: Story = {
  args: {
    children: <Button>Menu with 100 items</Button>,
    items: [
      {
        label: 'Option 1',
        value: '1',
        onScrollToBottom: () => {
          console.info(
            '🎯 Submenu scrolled to bottom! This fires only when entering the 10px zone.'
          );
        },
        items: Array.from({ length: 100 }).map((_, index) => ({
          label: `Sub Option ${index}`,
          value: `1-${index + 1}`,
          selected: index === 85,
        })),
      },
    ],
  },
};

// Example with onScrollToBottom on main dropdown
export const WithScrollToBottomCallback: Story = {
  args: {
    children: <Button>Scroll to Bottom Test</Button>,
    menuHeader: 'Search items...',
    onScrollToBottom: () => {
      console.info(
        '🎯 Main dropdown scrolled to bottom! This fires only when entering the 10px zone.'
      );
    },
    items: Array.from({ length: 100 }).map((_, index) => ({
      label: `Item ${index + 1}`,
      value: `item-${index + 1}`,
      secondaryLabel: `Description for item ${index + 1}`,
    })),
  },
};

// Example with searchable nested menu
export const WithSearchableNestedMenu: Story = {
  render: () => {
    const [selectedOwners, setSelectedOwners] = React.useState<Set<string>>(new Set(['owner-2']));
    const [selectedAssetTypes, setSelectedAssetTypes] = React.useState<Set<string>>(
      new Set(['report_file'])
    );

    // Mock owner data similar to FilterDropdown
    const mockOwners = Array.from({ length: 50 }).map((_, index) => ({
      id: `owner-${index + 1}`,
      name: faker.person.fullName(),
      email: faker.internet.email(),
    }));

    const handleOwnerSelect = (ownerId: string) => {
      setSelectedOwners((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(ownerId)) {
          newSet.delete(ownerId);
        } else {
          newSet.add(ownerId);
        }
        return newSet;
      });
    };

    const handleAssetTypeSelect = (assetType: string) => {
      setSelectedAssetTypes((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(assetType)) {
          newSet.delete(assetType);
        } else {
          newSet.add(assetType);
        }
        return newSet;
      });
    };

    const items: IDropdownItems = [
      {
        label: 'Asset Type',
        value: 'asset-type',
        icon: <Storage />,
        selectType: 'multiple',
        items: [
          {
            label: 'Chats',
            value: 'chat',
            selected: selectedAssetTypes.has('chat'),
            onClick: () => handleAssetTypeSelect('chat'),
          },
          {
            label: 'Reports',
            value: 'report_file',
            selected: selectedAssetTypes.has('report_file'),
            onClick: () => handleAssetTypeSelect('report_file'),
          },
          {
            label: 'Dashboards',
            value: 'dashboard_file',
            selected: selectedAssetTypes.has('dashboard_file'),
            onClick: () => handleAssetTypeSelect('dashboard_file'),
          },
          {
            label: 'Collections',
            value: 'collection',
            selected: selectedAssetTypes.has('collection'),
            onClick: () => handleAssetTypeSelect('collection'),
          },
        ],
      },
      {
        label: 'Owner',
        value: 'owner',
        icon: <PaintRoller />,
        selectType: 'multiple',
        menuHeader: 'Search owners by name or email',
        onScrollToBottom: () => {
          console.info('Scrolled to bottom');
        },
        onSearch: (search) => {
          console.info('Searching owners:', search);
        },
        items: mockOwners.map((owner) => ({
          label: owner.name,
          value: owner.id,
          searchLabel: `${owner.name} ${owner.email}`,
          secondaryLabel: owner.email,
          selected: selectedOwners.has(owner.id),
          onClick: () => handleOwnerSelect(owner.id),
        })),
      },
      {
        label: 'Priority',
        value: 'priority',
        icon: <Star />,
        selectType: 'multiple',
        menuHeader: 'Search priorities',
        items: [
          { label: 'High', value: 'high', searchLabel: 'High priority' },
          { label: 'Medium', value: 'medium', searchLabel: 'Medium priority' },
          { label: 'Low', value: 'low', searchLabel: 'Low priority' },
        ],
      },
    ];

    return (
      <Dropdown items={items} menuHeader="Filters..." children={<Button>Open Filters</Button>} />
    );
  },
};
