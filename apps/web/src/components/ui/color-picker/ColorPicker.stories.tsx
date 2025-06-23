import type { Meta, StoryObj } from '@storybook/react';
import { ColorPicker } from './ColorPicker';

const meta: Meta<typeof ColorPicker> = {
  title: 'UI/ColorPicker/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
  args: {
    value: '#000000',
    size: 'default'
  },
  argTypes: {
    value: {
      control: 'color',
      description: 'The color value in hex format'
    },
    onChange: {
      description: 'Callback function when color changes'
    },
    onChangeComplete: {
      description: 'Callback function when color selection is complete'
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'tall'],
      description: 'The size of the color picker button'
    },

    className: {
      control: 'text',
      description: 'Additional CSS classes to apply'
    }
  }
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

export const Default: Story = {
  args: {
    value: '#FF0000'
  }
};

export const Small: Story = {
  args: {
    value: '#00FF00',
    size: 'small'
  }
};

export const Tall: Story = {
  args: {
    value: '#0000FF',
    size: 'tall'
  }
};
