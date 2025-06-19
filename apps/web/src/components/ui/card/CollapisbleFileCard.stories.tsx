import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { CollapisbleFileCard } from './CollapisbleFileCard';
import { File, Download, Image } from '../icons';

const meta: Meta<typeof CollapisbleFileCard> = {
  title: 'UI/card/CollapisbleFileCard',
  component: CollapisbleFileCard,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    fileName: {
      control: 'text',
      description: 'The file name to display'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    },
    bodyClassName: {
      control: 'text',
      description: 'Additional CSS classes for body'
    },
    headerClassName: {
      control: 'text',
      description: 'Additional CSS classes for header'
    },
    children: {
      control: 'text',
      description: 'Content to display inside the card'
    },
    collapsible: {
      control: { type: 'select' },
      options: ['chevron', 'overlay-peek', false],
      description: 'Collapsible behavior type'
    },
    collapseContent: {
      control: 'boolean',
      description: 'Whether the content is collapsed by default'
    },
    onCollapse: {
      action: 'collapsed',
      description: 'Callback when collapse state changes'
    }
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px', height: '300px' }}>
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fileName: 'example-file.pdf',
    children: null,
    collapsible: false,
    collapseContent: false,
    className: '',
    onCollapse: fn()
  }
};

export const WithContent: Story = {
  args: {
    fileName: 'document.pdf',
    children: (
      <div className="p-2">
        <h3 className="mb-2 text-lg font-semibold">Document Content</h3>
        <p className="mb-2 text-sm text-gray-600">
          This is a sample document with some content inside. It demonstrates how the card displays
          content when provided.
        </p>
        <p className="text-sm text-gray-600">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua.
        </p>
      </div>
    ),
    collapsible: false,
    onCollapse: fn()
  }
};

export const ChevronCollapsible: Story = {
  args: {
    fileName: 'collapsible-document.pdf',
    children: (
      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold">Collapsible Content</h3>
        <p className="mb-2 text-sm text-gray-600">
          This content can be collapsed and expanded using the chevron button.
        </p>
        <div className="space-y-2">
          <div className="rounded bg-gray-100 p-2">Item 1</div>
          <div className="rounded bg-gray-100 p-2">Item 2</div>
          <div className="rounded bg-gray-100 p-2">Item 3</div>
        </div>
      </div>
    ),
    collapsible: 'chevron',
    collapseContent: true,
    onCollapse: fn()
  }
};

export const ChevronCollapsibleWithDefaultIcon: Story = {
  args: {
    ...ChevronCollapsible.args,
    collapseDefaultIcon: <Download />
  }
};

export const ChevronCollapsedByDefault: Story = {
  args: {
    fileName: 'initially-collapsed.pdf',
    children: (
      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold">Initially Collapsed</h3>
        <p className="text-sm text-gray-600">
          This content starts collapsed and can be expanded by clicking the chevron.
        </p>
      </div>
    ),
    collapsible: 'chevron',
    collapseContent: true,
    onCollapse: fn()
  }
};

export const OverlayPeekCollapsible: Story = {
  args: {
    fileName: 'peek-document.pdf',
    children: (
      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold">Overlay Peek Content</h3>
        <p className="mb-4 text-sm text-gray-600">
          This content uses overlay-peek mode. When collapsed, you can see a preview of the content
          with an expand button.
        </p>
        <div className="space-y-2">
          <div className="rounded bg-blue-100 p-3">Section 1: Introduction</div>
          <div className="rounded bg-green-100 p-3">Section 2: Main Content</div>
          <div className="rounded bg-yellow-100 p-3">Section 3: Details</div>
          <div className="rounded bg-purple-100 p-3">Section 4: Conclusion</div>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Additional content that extends beyond the peek area to demonstrate the overlay
          functionality.
        </p>
      </div>
    ),
    collapsible: 'overlay-peek',
    collapseContent: true,
    onCollapse: fn()
  }
};

export const WithIcon: Story = {
  args: {
    fileName: 'document-with-icon.pdf',
    icon: <File />,
    children: (
      <div className="p-4">
        <p className="text-sm text-gray-600">
          This file card includes an icon in the header to indicate the file type.
        </p>
      </div>
    ),
    collapsible: 'chevron',
    collapseContent: false,
    onCollapse: fn()
  }
};

export const WithIconNoContent: Story = {
  args: {
    ...WithIcon.args,
    children: null
  }
};

export const WithCollapseDefaultIcon: Story = {
  args: {
    fileName: 'icon-toggle.pdf',
    icon: <File />,
    collapseDefaultIcon: <Download />,
    children: (
      <div className="p-4">
        <p className="text-sm text-gray-600">
          This card has a custom default icon that shows when collapsed and transforms to chevron on
          hover.
        </p>
      </div>
    ),
    collapsible: 'chevron',
    collapseContent: true,
    onCollapse: fn()
  }
};

export const DifferentFileTypes: Story = {
  args: {
    fileName: 'image-file.jpg',
    icon: <Image />,
    children: (
      <div className="p-4">
        <div className="flex h-32 items-center justify-center rounded bg-gray-200">
          <span className="text-gray-500">Image Preview</span>
        </div>
        <p className="mt-2 text-sm text-gray-600">Image file: 1920x1080, 2.4 MB</p>
      </div>
    ),
    collapsible: 'overlay-peek',
    collapseContent: false,
    onCollapse: fn()
  }
};

export const LongContent: Story = {
  args: {
    fileName: 'long-document.pdf',
    children: (
      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold">Long Document</h3>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="mb-3">
            <h4 className="font-medium">Section {i + 1}</h4>
            <p className="text-sm text-gray-600">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris.
            </p>
          </div>
        ))}
      </div>
    ),
    collapsible: 'overlay-peek',
    collapseContent: true,
    onCollapse: fn()
  }
};

export const NoFileName: Story = {
  args: {
    children: (
      <div className="p-4">
        <p className="text-sm text-gray-600">This card has no file name, just content.</p>
      </div>
    ),
    collapsible: false,
    onCollapse: fn()
  }
};

export const CustomStyling: Story = {
  args: {
    fileName: 'styled-card.pdf',
    className: 'border-2 border-blue-500 shadow-lg',
    headerClassName: 'bg-blue-50',
    bodyClassName: 'bg-blue-25',
    children: (
      <div className="p-4">
        <p className="text-sm text-gray-600">
          This card has custom styling applied to demonstrate the className props.
        </p>
      </div>
    ),
    collapsible: 'chevron',
    collapseContent: false,
    onCollapse: fn()
  }
};

export const OverlayPeekExpanded: Story = {
  args: {
    fileName: 'expanded-peek.pdf',
    children: (
      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold">Expanded Overlay Peek</h3>
        <p className="mb-4 text-sm text-gray-600">
          This story shows the overlay-peek mode in expanded state by default.
        </p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded bg-red-100 p-2 text-center">Feature A</div>
          <div className="rounded bg-blue-100 p-2 text-center">Feature B</div>
          <div className="rounded bg-green-100 p-2 text-center">Feature C</div>
          <div className="rounded bg-yellow-100 p-2 text-center">Feature D</div>
        </div>
        <p className="text-sm text-gray-600">
          You can collapse this to see the peek functionality with the expand button overlay.
        </p>
      </div>
    ),
    collapsible: 'overlay-peek',
    collapseContent: false,
    onCollapse: fn()
  }
};

export const ReactNodeFileName: Story = {
  args: {
    fileName: (
      <div className="flex items-center gap-2">
        <File />
        <span className="font-medium">Custom.jsx</span>
        <span className="rounded bg-green-100 px-1 text-xs text-green-800">React</span>
      </div>
    ),
    children: (
      <div className="p-4">
        <p className="text-sm text-gray-600">
          This demonstrates using a React node as the fileName instead of a plain string.
        </p>
      </div>
    ),
    collapsible: 'chevron',
    collapseContent: false,
    onCollapse: fn()
  }
};
