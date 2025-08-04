import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useMemo } from 'react';
import type { ContextMenuProps } from '../../context-menu/ContextMenu';
import { BusterList } from './index';
import type { BusterListColumn, BusterListRowItem } from './interfaces';

const meta: Meta<typeof BusterList> = {
  title: 'UI/List/BusterList',
  component: BusterList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    columns: { control: 'object' },
    rows: { control: 'object' },
    selectedRowKeys: { control: 'object' },
    showHeader: { control: 'boolean' },
    showSelectAll: { control: 'boolean' },
    useRowClickSelectChange: { control: 'boolean' },
    rowClassName: { control: 'text' },
    hideLastRowBorder: { control: 'boolean' }
  },
  decorators: [
    (Story) => (
      <div className="bg-background w-full min-w-[500px]">
        <Story />
      </div>
    )
  ]
};

export default meta;

// Define the data type for our rows
type SampleData = {
  name: string;
  age: number;
  address?: string;
  email?: string;
  actions?: any; // For the actions column
};

type Story = StoryObj<typeof BusterList<SampleData>>;

// Sample data for the stories
const sampleColumns: BusterListColumn<SampleData>[] = [
  {
    dataIndex: 'name',
    title: 'Name',
    width: 100
  },
  {
    dataIndex: 'age',
    title: 'Age',
    width: 100
  },
  {
    dataIndex: 'actions',
    title: 'Actions',
    width: 100,
    render: (_: any, record: SampleData) => (
      <button className="text-blue-500 hover:underline">View</button>
    )
  }
];

// Generate sample rows using faker
const generateSampleRows = (count: number): BusterListRowItem<SampleData>[] => {
  const rows: BusterListRowItem<SampleData>[] = [];

  // Generate regular rows
  for (let i = 0; i < count; i++) {
    rows.push({
      id: i.toString(),
      data: {
        name: faker.person.fullName(),
        age: faker.number.int({ min: 18, max: 80 }),
        address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
        email: faker.internet.email()
      }
    });

    if (i === 3) {
      rows.push({
        id: 'section' + i,
        data: null,
        rowSection: {
          title: faker.company.name(),
          secondaryTitle: faker.company.catchPhrase()
        }
      });
    }
  }

  // Add a section row in the middle
  const sectionIndex = Math.floor(count / 2);
  rows.splice(sectionIndex, 0, {
    id: 'section' + sectionIndex,
    data: null,
    rowSection: {
      title: faker.company.name(),
      secondaryTitle: faker.company.catchPhrase()
    }
  });

  return rows;
};

// Generate sample rows
const sampleRows: BusterListRowItem<SampleData>[] = generateSampleRows(5);

const sampleContextMenu: ContextMenuProps = {
  items: [
    {
      label: 'View Details',
      onClick: () => alert(`View`)
    },
    {
      label: 'Edit',
      onClick: () => alert(`Edit`)
    },
    {
      label: 'Delete',
      onClick: () => alert(`Delete`)
    }
  ]
};

export const Default: Story = {
  args: {
    columns: sampleColumns,
    rows: sampleRows,
    showHeader: true,
    showSelectAll: true
  },
  render: (args) => (
    <div style={{ height: '400px', width: '800px' }}>
      <BusterList {...args} />
    </div>
  )
};

export const WithSelection: Story = {
  render: () => {
    const sampleRows = useMemo(() => {
      return generateSampleRows(50);
    }, []);

    const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);

    return (
      <div style={{ height: '400px', width: '800px' }}>
        <div className="mb-4">
          <p className="rounded border border-blue-200 bg-blue-300 p-1 text-sm text-blue-900">
            Selected rows: {selectedKeys.join(', ') || 'None'}
          </p>
        </div>
        <BusterList
          columns={sampleColumns}
          rows={sampleRows}
          selectedRowKeys={selectedKeys}
          onSelectChange={setSelectedKeys}
          showHeader={true}
          showSelectAll={true}
        />
      </div>
    );
  }
};

export const WithContextMenu: Story = {
  args: {
    columns: sampleColumns,
    rows: sampleRows,
    contextMenu: sampleContextMenu,
    showHeader: true,
    showSelectAll: true
  },
  render: (args) => (
    <div style={{ height: '400px', width: '800px' }}>
      <BusterList {...args} />
    </div>
  )
};

export const WithRowClickSelection: Story = {
  render: () => {
    const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);

    return (
      <div style={{ height: '400px', width: '800px' }}>
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Selected rows: {selectedKeys.join(', ') || 'None'}
          </p>
        </div>
        <BusterList
          columns={sampleColumns}
          rows={sampleRows}
          selectedRowKeys={selectedKeys}
          onSelectChange={setSelectedKeys}
          useRowClickSelectChange={true}
          showHeader={true}
          showSelectAll={true}
        />
      </div>
    );
  }
};

export const WithoutHeader: Story = {
  args: {
    columns: sampleColumns,
    rows: sampleRows,
    showHeader: false
  },
  render: (args) => (
    <div style={{ height: '400px', width: '800px' }}>
      <BusterList {...args} />
    </div>
  )
};

export const EmptyState: Story = {
  args: {
    columns: sampleColumns,
    rows: [],
    emptyState: <div className="text-gray-500">No data available</div>,
    showHeader: true
  },
  render: (args) => (
    <div style={{ height: '400px', width: '800px' }}>
      <BusterList {...args} />
    </div>
  )
};

export const BorderVariant: Story = {
  render: () => {
    const [selectedKeys, setSelectedKeys] = React.useState<string[]>(
      generateSampleRows(30)
        .filter((_, index) => index % 3 === 0)
        .map((row) => row.id)
    );
    const rows = generateSampleRows(30);

    return (
      <div className="flex flex-col gap-4" style={{ height: '900px', width: '800px' }}>
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-medium">Border Variant with Many Rows</h3>
          <p className="text-sm text-gray-500">
            This variant remove the border of the last row. This is useful when you want to put this
            list inside of a container that already contains a border
          </p>
          <div className="mb-4">
            <p className="text-sm text-gray-500">
              Selected rows: {selectedKeys.join(', ') || 'None'}
            </p>
          </div>
          <div className="min-h-[300px]">
            <BusterList
              columns={sampleColumns}
              rows={rows}
              selectedRowKeys={selectedKeys}
              onSelectChange={setSelectedKeys}
              hideLastRowBorder={true}
              showHeader={true}
              showSelectAll={true}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-medium">Default Variant with Many Rows</h3>
          <p className="text-sm text-gray-500">
            This variant shows rows without container styling.
          </p>
          <div className="min-h-[300px]">
            <BusterList
              columns={sampleColumns}
              rows={rows}
              selectedRowKeys={selectedKeys}
              onSelectChange={setSelectedKeys}
              hideLastRowBorder={false}
              showHeader={true}
              showSelectAll={true}
            />
          </div>
        </div>
      </div>
    );
  }
};

// Story with many rows to demonstrate virtualization
export const ManyRows: Story = {
  args: {
    columns: sampleColumns,
    rows: generateSampleRows(100),
    showHeader: true,
    showSelectAll: true
  },
  render: (args) => (
    <div style={{ height: '400px', width: '800px' }}>
      <BusterList {...args} />
    </div>
  )
};

export const ManyRowsWithContextMenu: Story = {
  args: {
    columns: sampleColumns,
    rows: generateSampleRows(100),
    contextMenu: sampleContextMenu,
    showHeader: true,
    showSelectAll: true
  },
  render: (args) => (
    <div style={{ height: '400px', width: '800px' }}>
      <BusterList {...args} />
    </div>
  )
};

export const InteractiveSelection: Story = {
  render: () => {
    const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);

    return (
      <div style={{ height: '400px', width: '800px' }}>
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Selected rows: {selectedKeys.join(', ') || 'None'}
          </p>
        </div>
        <BusterList
          columns={sampleColumns}
          rows={sampleRows}
          selectedRowKeys={selectedKeys}
          onSelectChange={setSelectedKeys}
          showHeader={true}
          showSelectAll={true}
          useRowClickSelectChange={true}
        />
      </div>
    );
  }
};
