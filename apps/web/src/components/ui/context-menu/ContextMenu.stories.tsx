import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { fn } from 'storybook/test';
import { Button } from '../buttons/Button';
import { PaintRoller, Star, Storage } from '../icons';
import {
  CircleCopy,
  File,
  Window,
  WindowDownload,
  WindowEdit,
  WindowSettings,
  WindowUser,
} from '../icons/NucleoIconOutlined';
import { ContextMenu } from './ContextMenu';
import type { ContextMenuItems } from './contextMenu.types';

const meta: Meta<typeof ContextMenu> = {
  title: 'UI/Context/ContextMenu',
  component: ContextMenu,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    disabled: {
      control: 'boolean',
      defaultValue: false,
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ContextMenu>;

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
  },
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled}>
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
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
  },
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled} menuHeader={args.menuHeader}>
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
};

// Example with dividers and shortcuts
export const WithDividersAndShortcuts: Story = {
  args: {
    items: [
      {
        value: 'profile',
        label: 'Profile',
        onClick: fn(),
        icon: <WindowUser />,
        shortcut: '⌘P',
      },
      {
        value: 'settings',
        label: 'Settings',
        onClick: fn(),
        icon: <WindowSettings />,
        shortcut: '⌘S',
      },
      { type: 'divider' },
      {
        value: 'logout',
        label: 'Logout',
        onClick: fn(),
        icon: <Window />,
        shortcut: '⌘L',
      },
    ],
  },
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled}>
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
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
  },
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled} menuHeader={args.menuHeader}>
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
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
  },
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled}>
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
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
  },
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled} menuHeader={args.menuHeader}>
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
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
  },
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled}>
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
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
  },
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled} selectType={args.selectType}>
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
};

export const WithSelectionMultiple: Story = {
  render: () => {
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set(['3']));

    const items: ContextMenuItems = [
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
      <ContextMenu
        selectType="multiple"
        items={items}
        menuHeader={'Search items...'}
        onSelect={handleSelect}
      >
        <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
          Right-click here to open context menu!
        </div>
      </ContextMenu>
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
  },
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled} menuHeader={args.menuHeader}>
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
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
  },
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled} menuHeader={args.menuHeader}>
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
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
  },
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled} menuHeader={args.menuHeader}>
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
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
  },
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled} menuHeader={args.menuHeader}>
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
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
  },
  render: (args) => (
    <ContextMenu
      items={args.items}
      disabled={args.disabled}
      menuHeader={args.menuHeader}
      onSelect={args.onSelect}
    >
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
};

// Interactive example with links and multiple selection
export const WithLinksAndMultipleSelection: Story = {
  render: () => {
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set(['2']));

    const items: ContextMenuItems = [
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
      <ContextMenu
        selectType="multiple"
        items={items}
        menuHeader="Search documentation..."
        onSelect={handleSelect}
      >
        <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
          Right-click here to open context menu!
        </div>
      </ContextMenu>
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
  },
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled} footerContent={args.footerContent}>
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
};

export const WithFooterAndHeader: Story = {
  args: {
    ...WithFooterContent.args,
    menuHeader: 'Menu...',
  },
  render: (args) => (
    <ContextMenu
      items={args.items}
      disabled={args.disabled}
      footerContent={args.footerContent}
      menuHeader={args.menuHeader}
    >
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
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
  },
  render: (args) => (
    <ContextMenu
      items={args.items}
      disabled={args.disabled}
      showIndex={args.showIndex}
      selectType={args.selectType}
      onSelect={args.onSelect}
    >
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
};

export const WithNumberedItemsWithFilter: Story = {
  args: {
    ...{ ...WithNumberedItemsNoFilter.args },
    menuHeader: 'Search items...',
  },
  render: (args) => (
    <ContextMenu
      items={args.items}
      disabled={args.disabled}
      showIndex={args.showIndex}
      selectType={args.selectType}
      onSelect={args.onSelect}
      menuHeader={args.menuHeader}
    >
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
};

export const WithReactNodeSubMenu: Story = {
  args: {
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
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled}>
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
};

export const WithSubMenuAndHundredItems: Story = {
  args: {
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
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled}>
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
};

// Example with onScrollToBottom on main context menu
export const WithScrollToBottomCallback: Story = {
  args: {
    menuHeader: 'Search items...',
    onScrollToBottom: () => {
      console.info(
        '🎯 Main context menu scrolled to bottom! This fires only when entering the 10px zone.'
      );
    },
    items: Array.from({ length: 100 }).map((_, index) => ({
      label: `Item ${index + 1}`,
      value: `item-${index + 1}`,
      secondaryLabel: `Description for item ${index + 1}`,
    })),
  },
  render: (args) => (
    <ContextMenu
      items={args.items}
      disabled={args.disabled}
      menuHeader={args.menuHeader}
      onScrollToBottom={args.onScrollToBottom}
    >
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
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

    const items: ContextMenuItems = [
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
      <ContextMenu items={items} menuHeader="Filters...">
        <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
          Right-click here to open context menu!
        </div>
      </ContextMenu>
    );
  },
};
