import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { BusterList } from './BusterList';
import type {
  BusterListColumn,
  BusterListRow,
  BusterListRowItem,
  BusterListSectionRow,
} from './interfaces';

const meta: Meta<typeof BusterList> = {
  title: 'UI/List/BusterListNew',
  component: BusterList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    columns: { control: 'object' },
    rows: { control: 'object' },
    selectedRowKeys: { control: 'object' },
    showHeader: { control: 'boolean' },
    showSelectAll: { control: 'boolean' },
    useRowClickSelectChange: { control: 'boolean' },
    rowClassName: { control: 'text' },
    hideLastRowBorder: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div className="bg-background w-full min-w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

// Define the data type for our rows
type SampleData = {
  name: string;
  email: string;
  role: string;
};

type Story = StoryObj<typeof BusterList<SampleData>>;

// Sample columns
const sampleColumns: BusterListColumn<SampleData>[] = [
  {
    dataIndex: 'name',
    title: 'Name',
    width: 200,
  },
  {
    dataIndex: 'email',
    title: 'Email',
    width: 250,
  },
  {
    dataIndex: 'role',
    title: 'Role',
    width: 150,
    render: (value: string) => (
      <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
        {value}
      </span>
    ),
  },
];

// Generate sample rows
const sampleRows: BusterListRow<SampleData>[] = Array.from({ length: 125 }, (_, i) => {
  if (i % 10 === 0) {
    return {
      id: `section${i}`,
      type: 'section' as const,
      title: faker.company.name(),
      secondaryTitle: faker.company.catchPhrase(),
    } satisfies BusterListSectionRow;
  }

  return {
    type: 'row' as const,
    id: i.toString(),
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: faker.helpers.arrayElement(['Admin', 'Editor', 'Viewer']),
    },
  };
});

export const Default: Story = {
  args: {
    columns: sampleColumns,
    rows: sampleRows,
    showHeader: true,
  },
  render: (args) => {
    const [selectedRowKeys, setSelectedRowKeys] = React.useState<Set<string>>(new Set());
    return (
      <div style={{ height: '400px', width: '800px' }}>
        <BusterList
          {...args}
          selectedRowKeys={selectedRowKeys}
          onSelectChange={(v) => {
            console.log(v);
            setSelectedRowKeys(v);
          }}
        />
      </div>
    );
  },
};
