import type { Meta, StoryObj } from '@storybook/react';
import type React from 'react';
import { AppLayout } from './AppLayout';
import { AppPageLayout } from './AppPageLayout';

const TestContent = ({ children }: { children?: React.ReactNode }) => {
  if (children) {
    return children;
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <ul className="space-y-4">
        {Array.from({ length: 30 }, (_, i) => (
          <li key={i} className="rounded-lg bg-gray-100 p-4">
            List Item {i + 1} - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </li>
        ))}
      </ul>
    </div>
  );
};

const meta = {
  title: 'UI/Layouts/AppLayout',
  component: AppLayout,
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs']
} satisfies Meta<typeof AppLayout>;

export default meta;
type Story = StoryObj<typeof AppLayout>;

export const Default: Story = {
  args: {
    children: <TestContent />,
    floating: true
  }
};

export const NonFloating: Story = {
  args: {
    children: <TestContent />,
    floating: false
  }
};

export const WithAppPageLayout: Story = {
  args: {
    sidebar: <div className="">Sidebar Content</div>,
    children: (
      <TestContent>
        <AppPageLayout header="Page Header" scrollable>
          <>
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} className="p-4">
                List Item {i + 1} - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </div>
            ))}
          </>
        </AppPageLayout>
      </TestContent>
    ),
    floating: true
  }
};
