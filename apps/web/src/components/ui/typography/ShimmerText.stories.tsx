import type { Meta, StoryObj } from '@storybook/react';
import { ShimmerText } from './ShimmerText';

const meta: Meta<typeof ShimmerText> = {
  title: 'UI/Typography/ShimmerText',
  component: ShimmerText,
  tags: ['autodocs'],
  args: {
    text: 'Sample Shimmer Text'
  },
  argTypes: {
    text: {
      control: 'text',
      description: 'The text to display with shimmer effect'
    },
    colors: {
      control: { type: 'object' },
      description: 'Array of colors for the shimmer gradient (minimum 2 colors required)'
    },
    duration: {
      control: { type: 'number', min: 0.5, max: 5, step: 0.1 },
      description: 'Duration of the shimmer animation in seconds',
      defaultValue: 1.5
    },
    fontSize: {
      control: { type: 'number', min: 8, max: 36, step: 1 },
      description: 'Font size in pixels',
      defaultValue: 13
    }
  },
  decorators: [
    (Story) => (
      <div className="flex h-full w-full items-center justify-center">
        <Story />
      </div>
    )
  ]
};

export default meta;

type Story = StoryObj<typeof ShimmerText>;

export const Default: Story = {
  args: {
    text: 'Default Shimmer Text',
    colors: ['var(--color-foreground)', 'var(--color-text-tertiary)'],
    duration: 1.5,
    fontSize: 13
  }
};

export const CustomColors: Story = {
  args: {
    text: 'Custom Colors Shimmer',
    colors: ['#3b82f6', '#10b981', '#6366f1'],
    duration: 1.5,
    fontSize: 16
  }
};

export const SlowAnimation: Story = {
  args: {
    text: 'Slow Animation Shimmer',
    duration: 3,
    fontSize: 13
  }
};

export const FastAnimation: Story = {
  args: {
    text: 'Fast Animation Shimmer',
    duration: 0.8,
    fontSize: 13
  }
};

export const LargeText: Story = {
  args: {
    text: 'Large Shimmer Text',
    duration: 1.5,
    fontSize: 24
  }
};

export const MultipleExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ShimmerText text="Default Shimmer" duration={1.5} fontSize={13} />
      <ShimmerText
        text="Blue to Purple Shimmer"
        colors={['#3b82f6', '#8b5cf6']}
        duration={1.5}
        fontSize={16}
      />
      <ShimmerText
        text="Rainbow Shimmer"
        colors={['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']}
        duration={2.5}
        fontSize={18}
      />
      <ShimmerText
        text="Slow Shimmer"
        colors={['var(--color-text-base)', 'var(--color-text-tertiary)']}
        duration={3}
        fontSize={13}
      />
      <ShimmerText
        text="Fast Shimmer"
        colors={['var(--color-text-base)', 'var(--color-text-tertiary)']}
        duration={0.8}
        fontSize={13}
      />
    </div>
  )
};
