import type { Meta, StoryObj } from '@storybook/react';
import BusterLoadingLogo from './BusterLoadingLogo';

const meta: Meta<typeof BusterLoadingLogo> = {
  title: 'UI/loaders/BusterLoadingLogo',
  component: BusterLoadingLogo,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the component'
    },
    backgroundColor: {
      control: 'color',
      description: 'Color of the background path'
    },
    foregroundColor: {
      control: 'color',
      description: 'Color of the animated/static foreground path'
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the logo should animate or display statically'
    }
  },
  args: {
    backgroundColor: '#E0E0E0',
    foregroundColor: 'black',
    isLoading: true
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    isLoading: true
  }
};

export const Static: Story = {
  args: {
    isLoading: false
  }
};

export const CustomColors: Story = {
  args: {
    backgroundColor: '#f3f4f6',
    foregroundColor: '#3b82f6',
    isLoading: true
  }
};

export const CustomColorWithContainer: Story = {
  args: {
    backgroundColor: '#f3f4f6',
    foregroundColor: '#3b82f6',
    isLoading: true
  },
  render: (args) => (
    <div className="h-6 w-6">
      <BusterLoadingLogo {...args} />
    </div>
  )
};
