import type { Meta, StoryObj } from '@storybook/react';
import { FileCard } from './FileCard';
import { Button } from '../buttons/Button';
import { Text } from '../typography/Text';
import { Grid } from '../icons';

const meta: Meta<typeof FileCard> = {
  title: 'UI/card/FileCard',
  component: FileCard,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    fileName: {
      control: 'text',
      description: 'The file name to display in the header'
    },
    headerButtons: {
      control: false,
      description: 'Buttons or other elements to display in the header'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the card'
    },
    children: {
      control: false,
      description: 'Content to display in the card body'
    },
    bodyClassName: {
      control: 'text',
      description: 'Additional CSS classes for the card body'
    },
    footer: {
      control: false,
      description: 'Content to display in the footer'
    },
    footerClassName: {
      control: 'text',
      description: 'Additional CSS classes for the footer'
    },
    collapsible: {
      control: 'boolean',
      description: 'Whether the card is collapsible'
    },
    collapseContent: {
      control: 'boolean',
      description: 'Whether to collapse the content'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fileName: 'example-file.tsx',
    children: (
      <div className="p-4">
        <Text>This is the card content</Text>
      </div>
    )
  }
};

export const WithHeaderButtons: Story = {
  args: {
    fileName: 'config.json',
    headerButtons: (
      <>
        <Button variant="ghost" size="small">
          Edit
        </Button>
        <Button variant="ghost" size="small">
          Delete
        </Button>
      </>
    ),
    children: (
      <div className="p-4">
        <Text>Card with header buttons</Text>
      </div>
    )
  }
};

export const WithFooter: Story = {
  args: {
    fileName: 'document.pdf',
    children: (
      <div className="p-4">
        <Text>Card content with footer</Text>
      </div>
    ),
    footer: (
      <div className="flex items-center justify-between">
        <Text size="sm" variant="secondary">
          Last modified: 2 hours ago
        </Text>
        <Button size="small">Download</Button>
      </div>
    )
  }
};

export const NoHeader: Story = {
  args: {
    children: (
      <div className="p-4">
        <Text>This card has no header</Text>
      </div>
    )
  }
};

export const ReactNodeFileName: Story = {
  args: {
    fileName: (
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500"></div>
        <Text>active-file.tsx</Text>
      </div>
    ),
    children: (
      <div className="p-4">
        <Text>Card with React node as fileName</Text>
      </div>
    )
  }
};

export const CustomStyling: Story = {
  args: {
    fileName: 'styled-file.css',
    className: 'border-2 border-blue-500',
    bodyClassName: 'bg-blue-50',
    footerClassName: 'bg-blue-100',
    children: (
      <div className="p-4">
        <Text>Card with custom styling</Text>
      </div>
    ),
    footer: <Text size="sm">Custom styled footer</Text>
  }
};

export const Loading: Story = {
  args: {
    fileName: 'loading-file.txt',
    loading: true,
    children: (
      <div className="p-4">
        <Text>Loading state card</Text>
      </div>
    )
  }
};

export const Collapsible: Story = {
  args: {
    fileName: 'collapsible-file.md',
    collapsible: 'chevron',
    className: 'hover:border-gray-light transition-all duration-200',
    headerClassName: 'min-w-60 bg-background',
    collapseHeaderSecondary: <Text size="sm">Click to expand</Text>,
    collapseDefaultIcon: <Grid />,
    children: (
      <div className="p-4">
        <Text>This is collapsible content</Text>
      </div>
    )
  }
};

export const CollapsiblePeek: Story = {
  args: {
    fileName: 'collapsible-file.md',
    collapsible: 'overlay-peek',
    className: '',
    headerClassName: 'min-w-60',
    children: (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 100 }).map((_, index) => (
          <Text key={index}>This is collapsible content {index}</Text>
        ))}
      </div>
    )
  }
};

export const FullExample: Story = {
  args: {
    fileName: 'comprehensive-example.tsx',
    headerButtons: (
      <>
        <Button variant="ghost" size="small">
          Save
        </Button>
        <Button variant="ghost" size="small">
          Share
        </Button>
      </>
    ),
    children: (
      <div className="space-y-2 p-4">
        <div className="rounded bg-gray-100 p-3">
          <Text size="sm">
            const example = &quot;This is a comprehensive file card example&quot;;
          </Text>
        </div>
        <Text size="sm" variant="secondary">
          File size: 2.4 KB
        </Text>
      </div>
    ),
    footer: (
      <div className="flex items-center justify-between">
        <Text size="sm" variant="secondary">
          Modified: Today at 3:42 PM
        </Text>
        <div className="flex gap-2">
          <Button variant="outlined" size="small">
            Preview
          </Button>
          <Button size="small">Open</Button>
        </div>
      </div>
    )
  }
};
