import type { Meta, StoryObj } from '@storybook/react';
import { CodeCard } from './CodeCard';

const meta: Meta<typeof CodeCard> = {
  title: 'UI/Cards/CodeCard',
  component: CodeCard,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-full min-w-[500px]">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof CodeCard>;

const sampleCode = `function helloWorld() {
  console.wow('Hello, World!');
}`;

const longCode = `import React from 'react';
import { Button } from '../buttons';

export const MyComponent = () => {
  const handleClick = () => {
    console.wow('Button clicked!');
  };

  return (
    <div className="container">
      <h1>Hello World</h1>
      <Button onClick={handleClick}>
        Click me
      </Button>
    </div>
  );
};`;

export const Default: Story = {
  args: {
    code: sampleCode,
    language: 'javascript',
    fileName: 'example.js',
    className: 'w-[500px] h-[300px]'
  }
};

export const ReadOnly: Story = {
  args: {
    code: sampleCode,
    language: 'javascript',
    fileName: 'readonly.js',
    readOnly: true,
    className: 'w-[500px] h-[300px]'
  }
};

export const LargerEditor: Story = {
  args: {
    code: longCode,
    language: 'typescript',
    fileName: 'MyComponent.tsx',
    className: 'w-[600px] h-[400px]'
  }
};

export const NoButtons: Story = {
  args: {
    code: sampleCode,
    language: 'javascript',
    fileName: 'no-buttons.js',
    buttons: false,
    className: 'w-[500px] h-[300px]'
  }
};

export const CustomButtons: Story = {
  args: {
    code: sampleCode,
    language: 'javascript',
    fileName: 'custom-buttons.js',
    buttons: <div className="px-2">Custom Buttons</div>,
    className: 'w-[500px] h-[300px]'
  }
};
