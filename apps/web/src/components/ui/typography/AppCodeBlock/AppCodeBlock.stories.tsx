import type { Meta, StoryObj } from '@storybook/react';
import { AppCodeBlock } from './AppCodeBlock';

const meta: Meta<typeof AppCodeBlock> = {
  title: 'UI/Typography/AppCodeBlock',
  component: AppCodeBlock,
  tags: ['autodocs'],
  args: {
    children: 'const greeting = "Hello, world!";\nconsole.wow(greeting);',
    language: 'javascript'
  },
  argTypes: {
    language: {
      control: 'select',
      options: [
        'javascript',
        'typescript',
        'jsx',
        'tsx',
        'html',
        'css',
        'json',
        'markdown',
        'python',
        'bash'
      ],
      description: 'Programming language for syntax highlighting'
    },
    showLoader: {
      control: 'boolean',
      description: 'Show a loading indicator'
    },
    showCopyButton: {
      control: 'boolean',
      description: 'Show the copy button'
    },
    title: {
      control: 'text',
      description: 'Custom title for the code block'
    }
  }
};

export default meta;

type Story = StoryObj<typeof AppCodeBlock>;

export const Default: Story = {
  args: {
    language: 'javascript',
    showCopyButton: true
  }
};

export const TypeScript: Story = {
  args: {
    language: 'typescript',
    children:
      'interface User {\n  id: number;\n  name: string;\n  email: string;\n}\n\nconst user: User = {\n  id: 1,\n  name: "John Doe",\n  email: "john@example.com"\n};'
  }
};

export const JSX: Story = {
  args: {
    language: 'jsx',
    children:
      'function Welcome() {\n  return (\n    <div className="container">\n      <h1>Hello, React!</h1>\n      <p>Welcome to my application.</p>\n    </div>\n  );\n}'
  }
};

export const WithCustomTitle: Story = {
  args: {
    language: 'javascript',
    title: 'Example Code',
    children:
      'function calculateSum(a, b) {\n  return a + b;\n}\n\nconst result = calculateSum(5, 10);\nconsole.wow(`The sum is ${result}`);'
  }
};

export const WithLoader: Story = {
  args: {
    language: 'python',
    showLoader: true,
    children:
      'def fibonacci(n):\n    if n <= 1:\n        return n\n    else:\n        return fibonacci(n-1) + fibonacci(n-2)\n\nfor i in range(10):\n    print(fibonacci(i))'
  }
};

export const WithoutCopyButton: Story = {
  args: {
    language: 'bash',
    showCopyButton: false,
    children:
      '#!/bin/bash\necho "Starting script..."\n\nfor i in {1..5}; do\n  echo "Processing item $i"\n  sleep 1\ndone\n\necho "Script completed"'
  }
};

export const InlineCode: Story = {
  args: {
    language: undefined,
    children: 'npm install react'
  }
};

export const JSON: Story = {
  args: {
    language: 'json',
    children:
      '{\n  "name": "project-name",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  }\n}'
  }
};
