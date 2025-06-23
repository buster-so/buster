import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox } from '../checkbox';
import { BottleChampagne, Grid, HouseModern, PaintRoller } from '../icons';
import { PreventNavigation } from '../layouts/PreventNavigation';
import { AppSegmented } from './AppSegmented';

const meta: Meta<typeof AppSegmented> = {
  title: 'UI/Segmented/AppSegmented',
  component: AppSegmented,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
      </>
    )
  ],
  argTypes: {
    size: {
      control: 'radio',
      options: ['default', 'large']
    },
    block: {
      control: 'boolean'
    },
    value: {
      control: 'text'
    },
    type: {
      control: 'radio',
      options: ['button', 'track']
    }
  },
  render: (args) => {
    return (
      <div className="flex w-full min-w-[500px] flex-col items-center justify-center gap-4">
        <AppSegmented {...args} />
      </div>
    );
  }
};

export default meta;
type Story = StoryObj<typeof AppSegmented>;

const defaultItems = [
  { value: 'tab1', label: 'Tab 1', icon: <HouseModern /> },
  { value: 'tab2', label: 'Tab 2', disabled: true },
  { value: 'tab3', label: 'Tab 3' }
];

export const Default: Story = {
  args: {
    options: defaultItems
  }
};

export const Large: Story = {
  args: {
    options: defaultItems,
    size: 'large'
  }
};

export const Block: Story = {
  args: {
    options: defaultItems,
    block: true
  },
  parameters: {
    layout: 'padded'
  }
};

export const LargeBlock: Story = {
  args: {
    options: defaultItems,
    size: 'large',
    block: true
  },
  parameters: {
    layout: 'padded'
  }
};

export const WithIcons: Story = {
  args: {
    options: [
      { value: 'list', label: 'List', icon: <PaintRoller /> },
      { value: 'grid', label: 'Grid', icon: <Grid /> },
      { value: 'gallery', label: 'Gallery', icon: <BottleChampagne /> }
    ]
  }
};

export const Controlled: Story = {
  args: {
    options: defaultItems,
    value: 'tab2'
  }
};

export const WithDisabledItems: Story = {
  args: {
    options: [
      { value: 'tab1', label: 'Enabled' },
      { value: 'tab2', label: 'Disabled', disabled: true },
      { value: 'tab3', label: 'Enabled' }
    ]
  }
};

export const CustomStyling: Story = {
  args: {
    options: defaultItems,
    className: 'bg-blue-100 [&_[data-state=active]]:text-blue-700'
  }
};

export const WithOnlyIcons: Story = {
  args: {
    options: [
      { value: 'tab1', icon: <HouseModern />, tooltip: 'Tooltip 1' },
      { value: 'tab2', icon: <Grid />, tooltip: 'Tooltip 2' },
      { value: 'tab3', icon: <BottleChampagne />, tooltip: 'Tooltip 3' }
    ]
  }
};

export const WithPreventDefault: Story = {
  args: {
    options: [
      {
        value: 'tab1',
        icon: <HouseModern />,
        link: 'https://www.google.com',
        label: 'Tab 1',
        tooltip: 'Tooltip 1'
      },
      {
        value: 'tab2',
        icon: <Grid />,
        link: 'https://www.google.com',
        label: 'Tab 2',
        tooltip: 'Tooltip 2'
      },
      {
        value: 'tab3',
        icon: <BottleChampagne />,
        link: 'https://www.google.com',
        label: 'Tab 3',
        tooltip: 'Tooltip 3'
      }
    ]
  },
  render: (args) => {
    const [isDirty, setIsDirty] = useState(true);

    return (
      <div className="flex w-full min-w-[500px] flex-col items-center justify-center gap-4">
        <AppSegmented {...args} />

        <div className="flex items-center gap-2">
          <Checkbox
            checked={isDirty}
            onCheckedChange={(checked) => setIsDirty(checked === 'indeterminate' ? true : checked)}
          />
          <p>{isDirty ? 'Dirty' : 'Clean'}</p>
        </div>

        <PreventNavigation
          isDirty={isDirty}
          title="Title"
          description="Description"
          onOk={() => {
            alert('ok');
            return Promise.resolve();
          }}
          onCancel={() => {
            alert('cancel');
            return Promise.resolve();
          }}
        />
      </div>
    );
  }
};
