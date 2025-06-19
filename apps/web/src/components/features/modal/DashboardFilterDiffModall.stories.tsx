import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { DashboardFilterDiffModall } from './DashboardFilterDiffModall';

const meta = {
  title: 'Features/Modal/DashboardFilterDiffModall',
  component: DashboardFilterDiffModall,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof DashboardFilterDiffModall>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to generate random SQL queries
const generateSQLCode = () => {
  const tables = ['users', 'orders', 'products', 'customers', 'transactions'];
  const columns = ['id', 'name', 'email', 'created_at', 'status', 'price', 'quantity'];
  const conditions = [
    'active = true',
    "created_at > NOW() - INTERVAL '7 days'",
    "status = 'completed'",
    'price > 100'
  ];

  const randomTable = tables[Math.floor(Math.random() * tables.length)];
  const randomColumns = Array.from(
    { length: Math.floor(Math.random() * 3) + 1 },
    () => columns[Math.floor(Math.random() * columns.length)]
  ).join(', ');

  const whereClause =
    Math.random() > 0.5 ? `WHERE ${conditions[Math.floor(Math.random() * conditions.length)]}` : '';

  return `SELECT ${randomColumns} FROM ${randomTable} ${whereClause} LIMIT 100;`;
};

export const Default: Story = {
  args: {
    open: true,
    onClose: fn(),
    metrics: Array.from({ length: 25 }, () => {
      // Generate two different SQL queries
      const originalSQL = generateSQLCode();
      const modifiedSQL = generateSQLCode();

      return {
        id: faker.string.uuid(),
        name: faker.lorem.word(),
        description: faker.lorem.sentence(),
        code: modifiedSQL,
        original_code: originalSQL,
        version_number: faker.number.int({ min: 1, max: 100 })
      };
    })
  }
};
