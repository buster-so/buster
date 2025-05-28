import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';
import { ThemeList } from './ThemeList';

const meta: Meta<typeof ThemeList> = {
  title: 'Controllers/MetricController/ThemeList',
  component: ThemeList,
  parameters: {
    layout: 'centered'
  },
  args: {
    onChangeColorTheme: fn(),
    themes: [
      {
        name: 'Ocean Breeze',
        selected: true,
        colors: ['#1E88E5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#673AB7', '#3F51B5']
      },
      {
        name: 'Sunset',
        selected: false,
        colors: ['#FF7043', '#FFB74D', '#FFA726', '#FF5722', '#F4511E']
      },
      {
        name: 'Berry',
        selected: false,
        colors: [
          '#EC407A',
          '#AB47BC',
          '#7E57C2',
          '#5C6BC0',
          '#42A5F5',
          '#29B6F6',
          '#00BCD4',
          '#0097A7',
          '#00897B',
          '#43A047',
          '#7CB342',
          '#673AB7',
          '#3F51B5'
        ]
      },
      {
        name: 'Earth Tones',
        selected: false,
        colors: ['#795548', '#A1887F', '#8D6E63', '#6D4C41', '#5D4037']
      },
      {
        name: 'Neon',
        selected: false,
        colors: ['#FF1744', '#F50057', '#D500F9', '#651FFF', '#3D5AFE']
      },
      {
        name: 'Forest',
        selected: false,
        colors: ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A']
      },
      {
        name: 'Monochrome',
        selected: false,
        colors: ['#212121', '#424242', '#616161', '#757575', '#9E9E9E']
      },
      {
        name: 'Pastel',
        selected: false,
        colors: ['#FFB6C1', '#DDA0DD', '#B0E0E6', '#98FB98', '#F0E68C']
      },
      {
        name: 'Jewel Tones',
        selected: false,
        colors: ['#880E4F', '#4A148C', '#1A237E', '#0D47A1', '#1B5E20']
      }
    ]
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-[350px] min-w-[350px]">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof ThemeList>;

export const Default: Story = {};

export const SingleSelected: Story = {
  args: {
    themes: (meta.args?.themes ?? []).map((theme, index) => ({
      ...theme,
      selected: index === 2
    }))
  }
};

export const NoSelection: Story = {
  args: {
    themes: (meta.args?.themes ?? []).map((theme) => ({
      ...theme,
      selected: false
    }))
  }
};

export const SuperLongThemeName: Story = {
  args: {
    themes: (meta.args?.themes ?? []).map((theme) => ({
      ...theme,
      name: theme.name + ' - Super long theme name that will wrap because it is long'
    }))
  }
};
