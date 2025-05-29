import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';
import { Bell } from '@/components/ui/icons';
import { InfoCard } from './InfoCard';

const meta: Meta<typeof InfoCard> = {
  title: 'UI/Cards/InfoCard',
  component: InfoCard,
  tags: ['autodocs'],
  args: {
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    icon: <Bell />,
    onClick: () => {}
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'gray', 'ghost']
    },
    size: {
      control: 'select',
      options: ['default']
    },
    iconPosition: {
      control: 'select',
      options: ['top', 'center', 'bottom', 'absolute-top']
    },
    title: {
      control: 'text'
    },
    description: {
      control: 'text'
    },
    selected: {
      control: 'boolean'
    }
  }
};

export default meta;
type Story = StoryObj<typeof InfoCard>;

export const Default: Story = {
  args: {
    title: 'Notifications',
    description: 'You have 3 unread messages',
    icon: <Bell />,
    iconPosition: 'center'
  }
};

export const TopIcon: Story = {
  args: {
    title: 'System Status',
    description: 'All systems are operational',
    icon: <Bell />,
    iconPosition: 'top'
  }
};

export const BottomIcon: Story = {
  args: {
    title: 'Updates Available',
    description: 'New version 2.0 is ready to install',
    icon: <Bell />,
    iconPosition: 'bottom'
  }
};

export const AbsoluteTopIcon: Story = {
  args: {
    title: 'Important Notice',
    description: 'Please review your account settings',
    icon: <Bell />,
    iconPosition: 'absolute-top'
  }
};

export const NoIcon: Story = {
  args: {
    title: 'Simple Card',
    description: 'A card without an icon',
    icon: null
  }
};
