import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import type React from 'react';
import { useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/classMerge';
import { Hand } from '../icons';
import { SortableItemContext } from './_BusterSortableItemDragContainer';
import { BusterResizeableGrid } from './BusterResizeableGrid';
import { MIN_ROW_HEIGHT } from './helpers';
import type { BusterResizeableGridRow } from './interfaces';

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

// Story component with reset functionality
const GridWithReset: React.FC = () => {
  const originalRows: BusterResizeableGridRow[] = [
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

  const [rows, setRows] = useState<BusterResizeableGridRow[]>(originalRows);

  const handleReset = () => {
    const resetRows: BusterResizeableGridRow[] = [
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
    setRows(resetRows);
  };

  return (
    <div className="h-full w-full">
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleReset}
          className="bg-primary hover:bg-primary/90 focus:ring-primary rounded-md px-4 py-2 text-sm font-medium text-white focus:ring-2 focus:ring-offset-2 focus:outline-none">
          Reset Grid
        </button>
      </div>
      <BusterResizeableGrid rows={rows} onRowLayoutChange={setRows} readOnly={false} />
    </div>
  );
};

export const WithReset: Story = {
  render: () => <GridWithReset />
};
