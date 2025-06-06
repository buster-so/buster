import type { Meta, StoryObj } from '@storybook/react';
import { PaintRoller } from '../icons/NucleoIconOutlined';
import { ButtonDropdown } from './ButtonDropdown';

const meta: Meta<typeof ButtonDropdown> = {
  title: 'UI/Buttons/Button Dropdown',
  component: ButtonDropdown,
  parameters: {
    layout: 'centered'
  },
  args: {
    dropdownProps: {
      //  open: true,
      items: [
        {
          value: '1',
          label: 'Item 1'
        },
        {
          value: '2',
          label: 'Item 2',
          disabled: true
        },
        {
          value: '3',
          label: 'Item 3',
          icon: <PaintRoller />
        }
      ]
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'black', 'primary', 'ghost', 'link']
    },
    size: {
      control: 'select',
      options: ['default', 'tall', 'small']
    },
    disabled: {
      control: 'boolean',
      defaultValue: false
    },
    loading: {
      control: 'boolean',
      defaultValue: false
    },
    rounding: {
      control: 'select',
      defaultValue: 'default',
      options: ['default', 'full', 'large', 'small', 'none']
    },
    dropdownProps: {
      control: 'object'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof ButtonDropdown>;

export const Default: Story = {
  args: {
    buttonText: 'Button Text',
    variant: 'default'
  }
};

export const Primary: Story = {
  args: {
    buttonText: 'Primary Button',
    variant: 'primary'
  }
};

export const Black: Story = {
  args: {
    buttonText: 'Black Button',
    variant: 'black'
  }
};

export const Ghost: Story = {
  args: {
    buttonText: 'Ghost Button',
    variant: 'ghost'
  }
};

export const Link: Story = {
  args: {
    buttonText: 'Link Button',
    variant: 'link'
  }
};

export const Tall: Story = {
  args: {
    buttonText: 'Tall Button',
    size: 'tall'
  }
};

export const Small: Story = {
  args: {
    buttonText: 'Small Button',
    size: 'small'
  }
};

export const Disabled: Story = {
  args: {
    buttonText: 'Disabled Button',
    disabled: true
  }
};

export const WithIcon: Story = {
  args: {
    buttonText: 'With Icon',
    icon: <PaintRoller />
  }
};
