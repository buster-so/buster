import type { Meta, StoryObj } from '@storybook/react';
import * as OutlinedIcons from '../icons/NucleoIconOutlined';
import { ArrowUp } from '../icons/NucleoIconOutlined';
import { IconSelectOutlined } from '../icons/NucleoIconOutlined/iconStories';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Buttons/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Button'
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'black', 'primary', 'ghost', 'link', 'danger', 'warning', 'success']
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
    selected: {
      control: 'boolean',
      defaultValue: false
    },
    block: {
      control: 'boolean',
      defaultValue: false
    },
    prefix: {
      control: 'select',
      options: IconSelectOutlined
    },
    suffix: {
      control: 'select',
      options: IconSelectOutlined
    },
    rounding: {
      control: 'select',
      options: ['default', 'full', 'large', 'small', 'none']
    }
  },
  render: (args) => {
    const PrefixIcon = OutlinedIcons[args.prefix as keyof typeof OutlinedIcons];
    const SuffixIcon = OutlinedIcons[args.suffix as keyof typeof OutlinedIcons];
    const PrefixComponent = PrefixIcon ? <PrefixIcon /> : null;
    const SuffixComponent = SuffixIcon ? <SuffixIcon /> : null;
    return (
      <div className="flex gap-1 p-1">
        <Button {...args} prefix={PrefixComponent} suffix={SuffixComponent} />
      </div>
    );
  }
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    variant: 'default',
    size: 'default'
  }
};

export const Black: Story = {
  args: {
    variant: 'black',
    size: 'default'
  }
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'default'
  }
};

export const Tall: Story = {
  args: {
    variant: 'default',
    size: 'tall'
  }
};

export const Disabled: Story = {
  args: {
    variant: 'default',
    size: 'default',
    disabled: true
  }
};

export const Loading: Story = {
  args: {
    variant: 'default',
    size: 'default',
    loading: true
  }
};

export const WithBorder: Story = {
  args: {
    variant: 'default',
    size: 'default'
  }
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    size: 'default'
  }
};

export const Link: Story = {
  args: {
    variant: 'link',
    size: 'default'
  }
};

export const Small: Story = {
  args: {
    variant: 'default',
    size: 'small'
  }
};

export const IconButton: Story = {
  args: {
    variant: 'black',
    size: 'tall',
    prefix: 'ArrowUp',
    children: '',
    rounding: 'full'
  }
};

export const Block: Story = {
  args: {
    variant: 'primary',
    size: 'default',
    block: true,
    children: 'Full Width Button'
  }
};
