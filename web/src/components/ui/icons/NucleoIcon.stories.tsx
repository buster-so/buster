import type { Meta, StoryObj } from '@storybook/react';
import { IconSelectOutlined } from './NucleoIconOutlined/iconStories';
import { IconSelectFilled } from './NucleoIconFilled/iconStories';
import * as OutlinedIcons from './NucleoIconOutlined';
import * as FilledIcons from './NucleoIconFilled';
import type React from 'react';

const TestComponent: React.FC<{
  icon: string;
  color: string;
  size: '12px' | '16px' | '18px';
  strokewidth?: number;
  style?: 'outlined' | 'filled';
}> = ({
  icon = 'add-above',
  color = '#000000',
  size = '16px',
  strokewidth = 1.3,
  style = 'outlined'
}) => {
  const IconComponent =
    style === 'outlined'
      ? OutlinedIcons[icon as keyof typeof OutlinedIcons]
      : FilledIcons[icon as keyof typeof FilledIcons];

  if (!icon || !IconComponent) return null;

  return (
    <div className="flex items-center justify-center" style={{ fontSize: size, color: color }}>
      <IconComponent strokewidth={strokewidth} />
    </div>
  );
};

const meta: Meta<typeof TestComponent> = {
  title: 'UI/Icons/Nucleo',
  component: TestComponent,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    icon: {
      control: 'select',
      options: IconSelectOutlined,
      defaultValue: 'add-above'
    },
    color: {
      control: 'color',
      defaultValue: '#000000'
    },
    size: {
      control: 'select',
      options: ['12px', '16px', '18px']
    },
    strokewidth: {
      control: 'number',
      defaultValue: 1.3
    }
  },
  args: {
    icon: 'add-above',
    color: '#000000',
    size: '16px'
  }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Outlined: Story = {
  args: {
    icon: 'add-above',
    color: '#000000',
    size: '16px',
    style: 'outlined'
  }
};

export const Filled: Story = {
  args: {
    icon: 'add-above',
    color: '#000000',
    size: '16px',
    style: 'filled'
  },
  argTypes: {
    icon: {
      options: IconSelectFilled
    }
  }
};
