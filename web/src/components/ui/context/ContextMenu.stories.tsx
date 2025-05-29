import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  CircleCopy,
  File,
  Window,
  WindowDownload,
  WindowEdit,
  WindowSettings,
  WindowUser
} from '../icons/NucleoIconOutlined';
import { ContextMenu } from './ContextMenu';

const meta: Meta<typeof ContextMenu> = {
  title: 'UI/Context/ContextMenu',
  component: ContextMenu,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    disabled: {
      control: 'boolean',
      defaultValue: false
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof ContextMenu>;

// Basic example with simple items
export const Basic: Story = {
  args: {
    items: [
      {
        label: 'Edit',
        onClick: () => alert('Edit clicked'),
        icon: <WindowEdit />
      },
      {
        label: 'Settings',
        onClick: () => alert('Settings clicked'),
        icon: <WindowSettings />
      },
      {
        label: 'Logout',
        onClick: () => alert('Logout clicked'),
        icon: <Window />
      }
    ]
  },
  render: (args) => (
    <div className="flex h-[200px] w-[200px] items-center justify-center rounded-md border border-dashed">
      <ContextMenu items={args.items} disabled={args.disabled}>
        <div className="h-full w-full bg-gray-200 p-4 text-center">
          Right-click here to open context menu
        </div>
      </ContextMenu>
    </div>
  )
};

// Example with dividers and shortcuts
export const WithDividersAndShortcuts: Story = {
  args: {
    items: [
      {
        label: 'Profile',
        onClick: () => alert('Profile clicked'),
        icon: <WindowUser />,
        shortcut: '⌘P'
      },
      {
        label: 'Settings',
        onClick: () => alert('Settings clicked'),
        icon: <WindowSettings />,
        shortcut: '⌘S'
      },
      { type: 'divider' },
      {
        label: 'Logout',
        onClick: () => alert('Logout clicked'),
        icon: <Window />,
        shortcut: '⌘L'
      }
    ]
  },
  render: (args) => (
    <div className="flex h-[200px] w-[200px] items-center justify-center rounded-md border border-dashed">
      <ContextMenu items={args.items} disabled={args.disabled}>
        <div className="h-full w-full bg-gray-200 p-4 text-center">
          Right-click here to open context menu
        </div>
      </ContextMenu>
    </div>
  )
};

// Example with nested items
export const WithNestedItems: Story = {
  args: {
    items: [
      {
        label: 'File',
        icon: <File />,
        items: [
          {
            label: 'New',
            onClick: () => alert('New file clicked')
          },
          {
            label: 'Open',
            onClick: () => alert('Open file clicked')
          },
          {
            label: 'Save',
            onClick: () => alert('Save file clicked'),
            shortcut: '⌘S'
          }
        ]
      },
      {
        label: 'Edit',
        icon: <WindowEdit />,
        items: [
          {
            label: 'Copy',
            onClick: () => alert('Copy clicked'),
            icon: <CircleCopy />,
            shortcut: '⌘C'
          },
          {
            label: 'Delete',
            onClick: () => alert('Delete clicked'),
            icon: <Window />,
            shortcut: '⌫'
          }
        ]
      }
    ]
  },
  render: (args) => (
    <div className="flex h-[200px] w-[200px] items-center justify-center rounded-md border border-dashed">
      <ContextMenu items={args.items} disabled={args.disabled}>
        <div className="h-full w-full bg-gray-200 p-4 text-center">
          Right-click here to open context menu
        </div>
      </ContextMenu>
    </div>
  )
};

// Example with disabled items
export const WithDisabledItems: Story = {
  args: {
    items: [
      {
        label: 'Edit',
        onClick: () => alert('Edit clicked'),
        icon: <WindowEdit />
      },
      {
        label: 'Delete',
        onClick: () => alert('Delete clicked'),
        icon: <Window />,
        disabled: true
      },
      {
        label: 'Download',
        onClick: () => alert('Download clicked'),
        icon: <WindowDownload />
      }
    ]
  },
  render: (args) => (
    <div className="flex h-[200px] w-[200px] items-center justify-center rounded-md border border-dashed">
      <ContextMenu items={args.items} disabled={args.disabled}>
        <div className="h-full w-full bg-gray-200 p-4 text-center">
          Right-click here to open context menu
        </div>
      </ContextMenu>
    </div>
  )
};

// Example with loading state
export const WithLoadingItems: Story = {
  args: {
    items: [
      {
        label: 'Normal Item',
        onClick: () => alert('Normal clicked')
      },
      {
        label: 'Loading Item',
        loading: true,
        onClick: () => alert('Loading clicked')
      },
      { type: 'divider' },
      {
        label: 'Another Item',
        onClick: () => alert('Another clicked')
      }
    ]
  },
  render: (args) => (
    <div className="flex h-[200px] w-[200px] items-center justify-center rounded-md border border-dashed">
      <ContextMenu items={args.items} disabled={args.disabled}>
        <div className="h-full w-full bg-gray-200 p-4 text-center">
          Right-click here to open context menu
        </div>
      </ContextMenu>
    </div>
  )
};

// Example with selection
export const WithSelection: Story = {
  args: {
    items: [
      {
        label: 'Option 1',
        onClick: () => alert('Option 1 clicked'),
        selected: false
      },
      {
        label: 'Option 2',
        onClick: () => alert('Option 2 clicked'),
        selected: true
      },
      {
        label: 'Option 3',
        onClick: () => alert('Option 3 clicked'),
        selected: false
      }
    ]
  },
  render: (args) => (
    <div className="flex h-[200px] w-[200px] items-center justify-center rounded-md border border-dashed">
      <ContextMenu items={args.items} disabled={args.disabled}>
        <div className="h-full w-full bg-gray-200 p-4 text-center">
          Right-click here to open context menu
        </div>
      </ContextMenu>
    </div>
  )
};

// Example with secondary labels and truncation
export const WithSecondaryLabels: Story = {
  args: {
    items: [
      {
        label: 'Document 1',
        secondaryLabel: 'Last edited 2 days ago',
        onClick: () => alert('Document 1 clicked'),
        icon: <File />
      },
      {
        label: 'Document with a very long name that should be truncated',
        secondaryLabel: 'Last edited yesterday',
        truncate: true,
        onClick: () => alert('Document 2 clicked'),
        icon: <File />
      },
      {
        label: 'Document 3',
        secondaryLabel: 'Last edited just now',
        onClick: () => alert('Document 3 clicked'),
        icon: <File />
      }
    ]
  },
  render: (args) => (
    <div className="flex h-[200px] w-[200px] items-center justify-center rounded-md border border-dashed">
      <ContextMenu items={args.items} disabled={args.disabled}>
        <div className="h-full w-full bg-gray-200 p-4 text-center">
          Right-click here to open context menu
        </div>
      </ContextMenu>
    </div>
  )
};

// Example with links
export const WithLinks: Story = {
  args: {
    items: [
      {
        label: 'Documentation',
        link: 'https://example.com/docs',
        linkIcon: 'arrow-external'
      },
      {
        label: 'Settings',
        link: '/settings',
        linkIcon: 'arrow-right'
      },
      {
        label: 'Profile',
        link: '/profile',
        linkIcon: 'caret-right'
      }
    ]
  },
  render: (args) => (
    <div className="flex h-[200px] w-[200px] items-center justify-center rounded-md border border-dashed">
      <ContextMenu items={args.items} disabled={args.disabled} className="">
        <div className="h-full w-full bg-gray-200 p-4 text-center">
          Right-click here to open context menu
        </div>
      </ContextMenu>
    </div>
  )
};

// Example with custom width
export const CustomWidth: Story = {
  args: {
    items: [
      {
        label: 'This is a menu item with a very long label that might need to be constrained',
        onClick: () => alert('Long item clicked')
      },
      {
        label: 'Short item',
        onClick: () => alert('Short item clicked')
      }
    ]
  },
  render: (args) => (
    <div className="flex h-[200px] w-[200px] items-center justify-center rounded-md border border-dashed">
      <ContextMenu items={args.items} disabled={args.disabled} className="min-w-[400px]">
        <div className="h-full w-full bg-gray-200 p-4 text-center">
          Right-click here to open context menu
        </div>
      </ContextMenu>
    </div>
  )
};

export const ContextMenuWithEverything: Story = {
  args: {
    items: [
      {
        label: 'Option 1',
        onClick: () => alert('Option 1 clicked'),
        icon: <WindowUser />,
        selected: false,
        loading: true
      },
      {
        label: 'Option 2',
        onClick: () => alert('Option 2 clicked'),
        icon: <WindowSettings />,
        selected: true
      },
      {
        label: 'Option 3',
        onClick: () => alert('Option 3 clicked'),
        icon: <Window />,
        selected: false
      },
      { type: 'divider' },
      {
        label: 'Option 4',
        onClick: () => alert('Option 4 clicked'),
        icon: <Window />,
        link: 'https://example.com/docs',
        loading: true
      },
      {
        label: 'Option 5',
        onClick: () => alert('Option 5 clicked'),
        icon: <Window />,
        link: 'https://example.com/docs'
      },
      { type: 'divider' },
      {
        label: 'NESTED COMPONENT',
        onClick: () => alert('Option 6 clicked'),
        loading: false,
        icon: <Window />,
        items: [
          <div
            key="nested-item"
            className="flex min-h-10 min-w-10 items-center rounded bg-red-200 p-1 text-red-600">
            This is a nested item
          </div>
        ]
      },
      {
        label: 'Option 7',
        onClick: () => alert('Option 7 clicked'),
        icon: <Window />,
        items: [
          {
            label: 'Option 7.1',
            onClick: () => alert('Option 7.1 clicked')
          },
          {
            label: 'Option 7.2',
            onClick: () => alert('Option 7.2 clicked')
          }
        ]
      },
      {
        label: 'Option 8',
        onClick: () => alert('Option 8 clicked'),
        icon: <Window />,
        items: [
          {
            label: 'Option 8.1',
            onClick: () => alert('Option 8.1 clicked')
          },
          {
            label: 'Option 8.2',
            onClick: () => alert('Option 8.2 clicked')
          }
        ]
      }
    ]
  },
  render: (args) => (
    <div className="flex h-[200px] w-[200px] items-center justify-center rounded-md border border-dashed">
      <ContextMenu items={args.items} disabled={args.disabled}>
        <div className="h-full w-full bg-gray-200 p-4 text-center">
          Right-click here to open context menu
        </div>
      </ContextMenu>
    </div>
  )
};
