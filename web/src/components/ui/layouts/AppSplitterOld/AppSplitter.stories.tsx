import type { Meta, StoryObj } from '@storybook/react';
import { AppSplitter } from './AppSplitter';

const meta = {
  title: 'UI/Layouts/AppSplitter',
  component: AppSplitter,
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-2" style={{ height: '400px' }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof AppSplitter>;

export default meta;
type Story = StoryObj<typeof meta>;

const LeftContent = () => (
  <div className="flex h-full w-full flex-col gap-3 bg-red-200 p-4">
    <h2 className="text-lg font-semibold">Left Panel</h2>
    <p>This is the left panel content</p>
  </div>
);

const RightContent = () => (
  <div className="flex h-full w-full flex-col gap-3 bg-blue-100 p-4">
    <h2 className="text-lg font-semibold">Right Panel</h2>
    <p>This is the right panel content</p>
  </div>
);

export const Default: Story = {
  args: {
    leftChildren: <LeftContent />,
    rightChildren: <RightContent />,
    autoSaveId: 'default-split',
    defaultLayout: ['50%', '50%'],
    allowResize: true,
    preserveSide: null
  }
};

export const LeftPreserved: Story = {
  args: {
    ...Default.args,
    autoSaveId: 'left-preserved-split',
    preserveSide: 'left',
    defaultLayout: ['300px', 'auto']
  }
};

export const RightPreserved: Story = {
  args: {
    ...Default.args,
    autoSaveId: 'right-preserved-split',
    preserveSide: 'right',
    defaultLayout: ['auto', '300px']
  }
};

export const WithMinMaxSizes: Story = {
  args: {
    ...Default.args,
    autoSaveId: 'min-max-split',
    leftPanelMinSize: '200px',
    leftPanelMaxSize: '60%',
    rightPanelMinSize: '200px',
    rightPanelMaxSize: '70%'
  }
};

export const HorizontalSplit: Story = {
  args: {
    ...Default.args,
    autoSaveId: 'horizontal-split',
    split: 'horizontal',
    defaultLayout: ['50%', '50%']
  }
};

export const NonResizable: Story = {
  args: {
    ...Default.args,
    autoSaveId: 'non-resizable-split',
    allowResize: false
  }
};

export const HiddenRight: Story = {
  args: {
    ...Default.args,
    autoSaveId: 'hidden-right-split',
    rightHidden: true
  }
};

export const HiddenLeft: Story = {
  args: {
    ...Default.args,
    autoSaveId: 'hidden-left-split',
    leftHidden: true
  }
};

export const HideSplitter: Story = {
  args: {
    ...Default.args,
    autoSaveId: 'hide-splitter',
    hideSplitter: true
  }
};
