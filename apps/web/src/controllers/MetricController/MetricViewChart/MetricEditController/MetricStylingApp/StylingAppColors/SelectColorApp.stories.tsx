import type { Meta, StoryObj } from '@storybook/react';
import { StylingAppColorsTab } from './config';
import { SelectColorApp } from './SelectColorApp';

const meta: Meta<typeof SelectColorApp> = {
  title: 'Controllers/EditMetricController/SelectColorApp',
  component: SelectColorApp,
  parameters: {
    layout: 'centered'
  },
  //tags: ['autodocs'],
  argTypes: {
    selectedTab: {
      control: 'select',
      options: Object.values(StylingAppColorsTab),
      description: 'The currently selected tab'
    },
    onChange: {
      action: 'onChange',
      description: 'Callback when tab selection changes'
    }
  },
  decorators: [
    (Story) => (
      <div className="flex w-[400px] flex-col items-center justify-center p-4">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof SelectColorApp>;

export const Default: Story = {
  args: {
    selectedTab: StylingAppColorsTab.Colors
  }
};

export const PalettesSelected: Story = {
  args: {
    selectedTab: StylingAppColorsTab.Palettes
  }
};

export const CustomSelected: Story = {
  args: {
    selectedTab: StylingAppColorsTab.Custom
  }
};

export const WithInteraction: Story = {
  args: {
    selectedTab: StylingAppColorsTab.Colors
  },
  play: async ({ canvasElement, args }) => {
    // This is where you could add interaction tests using the @storybook/testing-library
    // For example, clicking on different tabs and verifying the onChange callback is called
  }
};
