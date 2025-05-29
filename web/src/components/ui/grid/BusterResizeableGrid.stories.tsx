import { cn } from '@/lib/classMerge';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import type React from 'react';
import { useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Hand } from '../icons';
import { BusterResizeableGrid } from './BusterResizeableGrid';
import { SortableItemContext } from './_BusterSortableItemDragContainer';
import { MIN_ROW_HEIGHT } from './helpers';

const meta: Meta<typeof BusterResizeableGrid> = {
  title: 'UI/Grid/BusterResizeableGrid',
  component: BusterResizeableGrid,
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: '950px', width: '100%' }}>
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof BusterResizeableGrid>;

// Example content component for the grid items
const ExampleContent: React.FC<{ text: string }> = ({ text }) => {
  const { attributes, listeners, isDragging } = useContext(SortableItemContext);

  return (
    <div className="bg-gray-light/15 flex h-full w-full items-center justify-center rounded-lg border p-4">
      <div
        className={cn(
          'handle text-background absolute top-1 left-1 cursor-pointer bg-gray-500 p-2',
          isDragging && 'bg-primary'
        )}
        {...attributes}
        {...listeners}>
        <Hand />
      </div>
      {text}
    </div>
  );
};

const defaultRows = [
  {
    id: uuidv4(),
    items: [
      {
        id: uuidv4(),
        children: <ExampleContent text="Item 1" />
      },
      {
        id: uuidv4(),
        children: <ExampleContent text="Item 2" />
      }
    ],
    columnSizes: [6, 6],
    rowHeight: MIN_ROW_HEIGHT
  },
  {
    id: uuidv4(),
    items: [
      {
        id: uuidv4(),
        children: <ExampleContent text="Item 3" />
      },
      {
        id: uuidv4(),
        children: <ExampleContent text="Item 4" />
      },
      {
        id: uuidv4(),
        children: <ExampleContent text="Item 5" />
      }
    ],
    columnSizes: [4, 4, 4],
    rowHeight: MIN_ROW_HEIGHT
  },
  {
    id: uuidv4(),
    items: [
      {
        id: uuidv4(),
        children: <ExampleContent text="Item 6" />
      },
      {
        id: uuidv4(),
        children: <ExampleContent text="Item 7" />
      }
    ],
    columnSizes: [4, 4],
    rowHeight: MIN_ROW_HEIGHT
  }
];

export const Default: Story = {
  args: {
    rows: defaultRows,
    onRowLayoutChange: fn(),
    readOnly: false
  }
};

export const ReadOnly: Story = {
  args: {
    rows: defaultRows,
    onRowLayoutChange: fn(),
    readOnly: true
  }
};

export const SingleRow: Story = {
  args: {
    rows: [defaultRows[0]],
    onRowLayoutChange: fn(),
    readOnly: false
  }
};

export const ThreeColumns: Story = {
  args: {
    rows: [
      {
        id: uuidv4(),
        items: [
          {
            id: uuidv4(),
            children: <ExampleContent text="Column 1" />
          },
          {
            id: uuidv4(),
            children: <ExampleContent text="Column 2" />
          },
          {
            id: uuidv4(),
            children: <ExampleContent text="Column 3" />
          }
        ],
        columnSizes: [4, 4, 4],
        rowHeight: 200
      }
    ],
    onRowLayoutChange: fn(),
    readOnly: false
  }
};

export const CustomOverlay: Story = {
  args: {
    rows: defaultRows,
    onRowLayoutChange: fn(),
    readOnly: false,
    overlayComponent: (
      <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 p-4">
        Dragging...
      </div>
    )
  }
};

export const EmptyColumnSizes: Story = {
  args: {
    rows: [
      {
        id: uuidv4(),
        items: [
          {
            id: uuidv4(),
            children: <ExampleContent text="Row 1 Item 1" />
          },
          {
            id: uuidv4(),
            children: <ExampleContent text="Row 1 Item 2" />
          }
        ],
        columnSizes: [],
        rowHeight: MIN_ROW_HEIGHT
      },
      {
        id: uuidv4(),
        items: [
          {
            id: uuidv4(),
            children: <ExampleContent text="Row 2 Item 1" />
          },
          {
            id: uuidv4(),
            children: <ExampleContent text="Row 2 Item 2" />
          },
          {
            id: uuidv4(),
            children: <ExampleContent text="Row 2 Item 3" />
          }
        ],
        columnSizes: [],
        rowHeight: MIN_ROW_HEIGHT
      },
      {
        id: uuidv4(),
        items: [
          {
            id: uuidv4(),
            children: <ExampleContent text="Row 3 Item 1" />
          },
          {
            id: uuidv4(),
            children: <ExampleContent text="Row 3 Item 2" />
          }
        ],
        columnSizes: [],
        rowHeight: MIN_ROW_HEIGHT
      }
    ],
    onRowLayoutChange: fn(),
    readOnly: false
  }
};
