import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
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
        value: 'edit',
        label: 'Edit',
        onClick: () => alert('Edit clicked'),
        icon: <WindowEdit />,
      },
      {
        value: 'settings',
        label: 'Settings',
        onClick: () => alert('Settings clicked'),
        icon: <WindowSettings />,
      },
      {
        value: 'logout',
        label: 'Logout',
        onClick: () => alert('Logout clicked'),
        icon: <Window />,
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

// Example with dividers and shortcuts
export const WithDividersAndShortcuts: Story = {
  args: {
    items: [
      {
        value: 'profile',
        label: 'Profile',
        onClick: () => alert('Profile clicked'),
        icon: <WindowUser />,
        shortcut: '⌘P',
      },
      {
        value: 'settings',
        label: 'Settings',
        onClick: () => alert('Settings clicked'),
        icon: <WindowSettings />,
        shortcut: '⌘S',
      },
      { type: 'divider' },
      {
        value: 'logout',
        label: 'Logout',
        onClick: () => alert('Logout clicked'),
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
    items: [
      {
        value: 'file',
        label: 'File',
        icon: <File />,
        items: [
          {
            value: 'new',
            label: 'New',
            onClick: () => alert('New file clicked'),
          },
          {
            value: 'open',
            label: 'Open',
            onClick: () => alert('Open file clicked'),
          },
          {
            value: 'save',
            label: 'Save',
            onClick: () => alert('Save file clicked'),
            shortcut: '⌘S',
          },
        ],
      },
      {
        value: 'edit',
        label: 'Edit',
        icon: <WindowEdit />,
        items: [
          {
            value: 'copy',
            label: 'Copy',
            onClick: () => alert('Copy clicked'),
            icon: <CircleCopy />,
            shortcut: '⌘C',
          },
          {
            value: 'delete',
            label: 'Delete',
            onClick: () => alert('Delete clicked'),
            icon: <Window />,
            shortcut: '⌫',
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

// Example with disabled items
export const WithDisabledItems: Story = {
  args: {
    items: [
      {
        value: 'edit',
        label: 'Edit',
        onClick: () => alert('Edit clicked'),
        icon: <WindowEdit />,
      },
      {
        value: 'delete',
        label: 'Delete',
        onClick: () => alert('Delete clicked'),
        icon: <Window />,
        disabled: true,
      },
      {
        value: 'download',
        label: 'Download',
        onClick: () => alert('Download clicked'),
        icon: <WindowDownload />,
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

// Example with loading state
export const WithLoadingItems: Story = {
  args: {
    items: [
      {
        value: 'normal',
        label: 'Normal Item',
        onClick: () => alert('Normal clicked'),
      },
      {
        value: 'loading',
        label: 'Loading Item',
        loading: true,
        onClick: () => alert('Loading clicked'),
      },
      { type: 'divider' },
      {
        value: 'another',
        label: 'Another Item',
        onClick: () => alert('Another clicked'),
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
export const WithSelection: Story = {
  args: {
    items: [
      {
        value: 'option1',
        label: 'Option 1',
        onClick: () => alert('Option 1 clicked'),
        selected: false,
      },
      {
        value: 'option2',
        label: 'Option 2',
        onClick: () => alert('Option 2 clicked'),
        selected: true,
      },
      {
        value: 'option3',
        label: 'Option 3',
        onClick: () => alert('Option 3 clicked'),
        selected: false,
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

// Example with secondary labels and truncation
export const WithSecondaryLabels: Story = {
  args: {
    items: [
      {
        value: 'doc1',
        label: 'Document 1',
        secondaryLabel: 'Last edited 2 days ago',
        onClick: () => alert('Document 1 clicked'),
        icon: <File />,
      },
      {
        value: 'doc2',
        label: 'Document with a very long name that should be truncated',
        secondaryLabel: 'Last edited yesterday',
        truncate: true,
        onClick: () => alert('Document 2 clicked'),
        icon: <File />,
      },
      {
        value: 'doc3',
        label: 'Document 3',
        secondaryLabel: 'Last edited just now',
        onClick: () => alert('Document 3 clicked'),
        icon: <File />,
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

// Example with links
export const WithLinks: Story = {
  args: {
    items: [
      {
        value: 'docs',
        label: 'Documentation',
        link: 'https://example.com/docs',
        linkIcon: 'arrow-external',
      },
      {
        value: 'settings',
        label: 'Settings',
        link: '/settings',
        linkIcon: 'arrow-right',
      },
      {
        value: 'profile',
        label: 'Profile',
        link: '/profile',
        linkIcon: 'caret-right',
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

// Example with custom width
export const CustomWidth: Story = {
  args: {
    items: [
      {
        value: 'long',
        label: 'This is a menu item with a very long label that might need to be constrained',
        onClick: () => alert('Long item clicked'),
      },
      {
        value: 'short',
        label: 'Short item',
        onClick: () => alert('Short item clicked'),
      },
    ],
  },
  render: (args) => (
    <ContextMenu items={args.items} disabled={args.disabled} className="min-w-[400px]">
      <div className="flex h-[200px] min-h-[200px] w-[200px] min-w-[200px] items-center justify-center rounded-md border border-dashed bg-gray-200 p-4 text-center">
        Right-click here to open context menu!
      </div>
    </ContextMenu>
  ),
};

export const ContextMenuWithEverything: Story = {
  args: {
    items: [
      {
        value: 'option1',
        label: 'Option 1',
        onClick: () => alert('Option 1 clicked'),
        icon: <WindowUser />,
        selected: false,
        loading: true,
      },
      {
        value: 'option2',
        label: 'Option 2',
        onClick: () => alert('Option 2 clicked'),
        icon: <WindowSettings />,
        selected: true,
      },
      {
        value: 'option3',
        label: 'Option 3',
        onClick: () => alert('Option 3 clicked'),
        icon: <Window />,
        selected: false,
      },
      { type: 'divider' },
      {
        value: 'option4',
        label: 'Option 4',
        onClick: () => alert('Option 4 clicked'),
        icon: <Window />,
        link: 'https://example.com/docs',
        loading: true,
      },
      {
        value: 'option5',
        label: 'Option 5',
        onClick: () => alert('Option 5 clicked'),
        icon: <Window />,
        link: 'https://example.com/docs',
      },
      { type: 'divider' },
      {
        value: 'nested-component',
        label: 'NESTED COMPONENT',
        onClick: () => alert('Option 6 clicked'),
        loading: false,
        icon: <Window />,
        items: [
          <div
            key="nested-item"
            className="flex min-h-10 min-w-10 items-center rounded bg-red-200 p-1 text-red-600"
          >
            This is a nested item
          </div>,
        ],
      },
      {
        value: 'option7',
        label: 'Option 7',
        onClick: () => alert('Option 7 clicked'),
        icon: <Window />,
        items: [
          {
            value: 'option7-1',
            label: 'Option 7.1',
            onClick: () => alert('Option 7.1 clicked'),
          },
          {
            value: 'option7-2',
            label: 'Option 7.2',
            onClick: () => alert('Option 7.2 clicked'),
          },
        ],
      },
      {
        value: 'option8',
        label: 'Option 8',
        onClick: () => alert('Option 8 clicked'),
        icon: <Window />,
        items: [
          {
            value: 'option8-1',
            label: 'Option 8.1',
            onClick: () => alert('Option 8.1 clicked'),
          },
          {
            value: 'option8-2',
            label: 'Option 8.2',
            onClick: () => alert('Option 8.2 clicked'),
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
