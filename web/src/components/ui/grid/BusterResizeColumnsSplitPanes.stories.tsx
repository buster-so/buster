import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { BusterResizeColumnsSplitPanes } from './BusterResizeColumnsSplitPanes';

const meta: Meta<typeof BusterResizeColumnsSplitPanes> = {
  title: 'UI/Grid/BusterResizeColumnsSplitPanes',
  component: BusterResizeColumnsSplitPanes,
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs'],
  args: {
    onDragStart: fn(),
    onDragEnd: fn(),
    onChange: fn()
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const SampleColumn = ({ title, color }: { title: string; color: string }) => (
  <div
    className="flex h-32 items-center justify-center rounded-lg font-semibold text-white"
    style={{ backgroundColor: color }}>
    {title}
  </div>
);

export const TwoColumns: Story = {
  render: (args) => {
    const [columnSpans, setColumnSpans] = useState([6, 6]);

    const handleChange = (newSpans: number[]) => {
      setColumnSpans(newSpans);
      args.onChange?.(newSpans);
    };

    return (
      <div className="h-64 w-full p-4">
        <BusterResizeColumnsSplitPanes
          columnSpans={columnSpans}
          allowResize={true}
          onChange={handleChange}
          onDragStart={args.onDragStart}
          onDragEnd={args.onDragEnd}>
          <SampleColumn title="Column 1" color="#3b82f6" />
          <SampleColumn title="Column 2" color="#ef4444" />
        </BusterResizeColumnsSplitPanes>
        <div className="mt-4 text-sm text-gray-600">Column spans: {columnSpans.join(', ')}</div>
      </div>
    );
  }
};

export const ThreeColumns: Story = {
  render: (args) => {
    const [columnSpans, setColumnSpans] = useState([4, 4, 4]);

    const handleChange = (newSpans: number[]) => {
      setColumnSpans(newSpans);
      args.onChange?.(newSpans);
    };

    return (
      <div className="h-64 w-full p-4">
        <BusterResizeColumnsSplitPanes
          columnSpans={columnSpans}
          allowResize={true}
          onChange={handleChange}
          onDragStart={args.onDragStart}
          onDragEnd={args.onDragEnd}>
          <SampleColumn title="Column 1" color="#3b82f6" />
          <SampleColumn title="Column 2" color="#ef4444" />
          <SampleColumn title="Column 3" color="#10b981" />
        </BusterResizeColumnsSplitPanes>
        <div className="mt-4 text-sm text-gray-600">Column spans: {columnSpans.join(', ')}</div>
      </div>
    );
  }
};

export const FourColumns: Story = {
  render: (args) => {
    const [columnSpans, setColumnSpans] = useState([3, 3, 3, 3]);

    const handleChange = (newSpans: number[]) => {
      setColumnSpans(newSpans);
      args.onChange?.(newSpans);
    };

    return (
      <div className="h-64 w-full p-4">
        <BusterResizeColumnsSplitPanes
          columnSpans={columnSpans}
          allowResize={true}
          onChange={handleChange}
          onDragStart={args.onDragStart}
          onDragEnd={args.onDragEnd}>
          <SampleColumn title="Column 1" color="#3b82f6" />
          <SampleColumn title="Column 2" color="#ef4444" />
          <SampleColumn title="Column 3" color="#10b981" />
          <SampleColumn title="Column 4" color="#f59e0b" />
        </BusterResizeColumnsSplitPanes>
        <div className="mt-4 text-sm text-gray-600">Column spans: {columnSpans.join(', ')}</div>
      </div>
    );
  }
};

export const ReadOnly: Story = {
  render: () => {
    const [columnSpans] = useState([5, 7]);

    return (
      <div className="h-64 w-full p-4">
        <BusterResizeColumnsSplitPanes
          columnSpans={columnSpans}
          allowResize={false}
          onChange={() => {}}>
          <SampleColumn title="Column 1 (Read Only)" color="#6b7280" />
          <SampleColumn title="Column 2 (Read Only)" color="#9ca3af" />
        </BusterResizeColumnsSplitPanes>
        <div className="mt-4 text-sm text-gray-600">
          Column spans: {columnSpans.join(', ')} (Read Only)
        </div>
      </div>
    );
  }
};

export const Disabled: Story = {
  render: () => {
    const [columnSpans] = useState([6, 6]);

    return (
      <div className="h-64 w-full p-4">
        <BusterResizeColumnsSplitPanes
          columnSpans={columnSpans}
          disabled={true}
          onChange={() => {}}>
          <SampleColumn title="Column 1 (Disabled)" color="#6b7280" />
          <SampleColumn title="Column 2 (Disabled)" color="#9ca3af" />
        </BusterResizeColumnsSplitPanes>
        <div className="mt-4 text-sm text-gray-600">
          Column spans: {columnSpans.join(', ')} (Disabled - No Sashes)
        </div>
      </div>
    );
  }
};

export const SingleColumn: Story = {
  render: () => {
    const [columnSpans] = useState([12]);

    return (
      <div className="h-64 w-full p-4">
        <BusterResizeColumnsSplitPanes
          columnSpans={columnSpans}
          allowResize={true}
          onChange={() => {}}>
          {[<SampleColumn key="single" title="Single Column" color="#8b5cf6" />]}
        </BusterResizeColumnsSplitPanes>
        <div className="mt-4 text-sm text-gray-600">
          Column spans: {columnSpans.join(', ')} (Single Column - No Sashes)
        </div>
      </div>
    );
  }
};

export const FourColumnsNoResize: Story = {
  render: () => {
    const [columnSpans] = useState([3, 3, 3, 3]);

    return (
      <div className="h-64 w-full p-4">
        <BusterResizeColumnsSplitPanes
          columnSpans={columnSpans}
          allowResize={true}
          onChange={() => {}}>
          <SampleColumn title="Column 1" color="#3b82f6" />
          <SampleColumn title="Column 2" color="#ef4444" />
          <SampleColumn title="Column 3" color="#10b981" />
          <SampleColumn title="Column 4" color="#f59e0b" />
        </BusterResizeColumnsSplitPanes>
        <div className="mt-4 text-sm text-gray-600">
          Column spans: {columnSpans.join(', ')} (4 Columns - No Sashes, Not Resizable)
        </div>
      </div>
    );
  }
};

export const UnevenColumns: Story = {
  render: (args) => {
    const [columnSpans, setColumnSpans] = useState([3, 9]);

    const handleChange = (newSpans: number[]) => {
      setColumnSpans(newSpans);
      args.onChange?.(newSpans);
    };

    return (
      <div className="h-64 w-full p-4">
        <BusterResizeColumnsSplitPanes
          columnSpans={columnSpans}
          allowResize={true}
          onChange={handleChange}
          onDragStart={args.onDragStart}
          onDragEnd={args.onDragEnd}>
          <SampleColumn title="Small Column" color="#8b5cf6" />
          <SampleColumn title="Large Column" color="#ec4899" />
        </BusterResizeColumnsSplitPanes>
        <div className="mt-4 text-sm text-gray-600">Column spans: {columnSpans.join(', ')}</div>
      </div>
    );
  }
};
