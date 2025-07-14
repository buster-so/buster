import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AppMarkdownStreamable } from './AppMarkdownStreamable';

const meta: Meta<typeof AppMarkdownStreamable> = {
  title: 'Components/Typography/AppMarkdownStreamable',
  component: AppMarkdownStreamable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A React component that renders markdown content with smooth streaming animation effects.'
      }
    }
  },
  argTypes: {
    content: {
      control: 'text',
      description: 'Markdown content to render'
    },
    animation: {
      control: 'select',
      options: ['fade-in'],
      description: 'Animation type'
    },
    animationDuration: {
      control: 'number',
      description: 'Animation duration in milliseconds'
    },
    animationTimingFunction: {
      control: 'select',
      options: ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'],
      description: 'CSS timing function'
    },
    streaming: {
      control: 'boolean',
      description: 'Whether to enable streaming animation'
    },
    separator: {
      control: 'select',
      options: ['word', 'character', 'diff'],
      description: 'How to separate content for animation'
    },
    charactersPerSecond: {
      control: 'number',
      description: 'Rate of character revelation'
    },
    className: {
      control: 'text',
      description: 'CSS class names'
    }
  }
};

export default meta;
type Story = StoryObj<typeof AppMarkdownStreamable>;

const sampleMarkdown = `# Welcome to Streaming Markdown

This is a **demonstration** of the streaming markdown component. It supports various markdown features:

## Features

- **Bold text** and *italic text*
- Code blocks and \`inline code\`
- Lists and links
- Blockquotes and more

### Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

### List Example

1. First item
2. Second item
3. Third item

- Bullet point one
- Bullet point two
- Bullet point three

> This is a blockquote that demonstrates how the streaming animation works with different markdown elements.

Visit [GitHub](https://github.com) for more information.

~~This text is crossed out~~

The animation should smoothly reveal each character, word, or diff based on the separator setting.`;

export const Default: Story = {
  args: {
    content: sampleMarkdown,
    streaming: true,
    animation: 'fade-in',
    animationDuration: 300,
    animationTimingFunction: 'ease-out',
    separator: 'character',
    charactersPerSecond: 100
  }
};

export const NoAnimation: Story = {
  args: {
    content: sampleMarkdown,
    streaming: false,
    animation: 'fade-in',
    animationDuration: 300,
    animationTimingFunction: 'ease-out',
    separator: 'character',
    charactersPerSecond: 100
  }
};

export const WordByWord: Story = {
  args: {
    content: sampleMarkdown,
    streaming: true,
    animation: 'fade-in',
    animationDuration: 200,
    animationTimingFunction: 'ease-out',
    separator: 'word',
    charactersPerSecond: 150
  }
};

export const SlowCharacterStream: Story = {
  args: {
    content: sampleMarkdown,
    streaming: true,
    animation: 'fade-in',
    animationDuration: 500,
    animationTimingFunction: 'ease-in-out',
    separator: 'character',
    charactersPerSecond: 50
  }
};

export const FastCharacterStream: Story = {
  args: {
    content: sampleMarkdown,
    streaming: true,
    animation: 'fade-in',
    animationDuration: 200,
    animationTimingFunction: 'ease-out',
    separator: 'character',
    charactersPerSecond: 200
  }
};

export const DiffMode: Story = {
  args: {
    content: sampleMarkdown,
    streaming: true,
    animation: 'fade-in',
    animationDuration: 400,
    animationTimingFunction: 'ease-out',
    separator: 'diff',
    charactersPerSecond: 100
  }
};

export const CustomStyling: Story = {
  args: {
    content: '# Custom Styled Content\n\nThis example shows **custom styling** with different classes.',
    streaming: true,
    animation: 'fade-in',
    animationDuration: 300,
    animationTimingFunction: 'ease-out',
    separator: 'character',
    charactersPerSecond: 100,
    className: 'bg-blue-50 p-4 rounded-lg border border-blue-200'
  }
};

export const SimpleText: Story = {
  args: {
    content: '# Simple Example\n\nThis is a simple example with **bold** and *italic* text.',
    streaming: true,
    animation: 'fade-in',
    animationDuration: 300,
    animationTimingFunction: 'ease-out',
    separator: 'character',
    charactersPerSecond: 100
  }
};

// Interactive story with controls
export const Interactive: Story = {
  args: {
    content: sampleMarkdown,
    streaming: true,
    animation: 'fade-in',
    animationDuration: 300,
    animationTimingFunction: 'ease-out',
    separator: 'character',
    charactersPerSecond: 100
  },
  render: (args) => {
    const [key, setKey] = useState(0);
    
    return (
      <div>
        <div className="mb-4">
          <button 
            onClick={() => setKey(prev => prev + 1)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Restart Animation
          </button>
        </div>
        <AppMarkdownStreamable key={key} {...args} />
      </div>
    );
  }
};

// Performance test with large content
const largeMarkdown = `# Performance Test

This is a large document to test performance with streaming animation.

${'## Section '.repeat(10)}

${Array(50).fill(0).map((_, i) => `### Subsection ${i + 1}\n\nThis is paragraph ${i + 1} with **bold text** and *italic text* and some \`inline code\`.\n\n`).join('')}

## Code Examples

${'```javascript\nfunction example() {\n  console.log("Hello, world!");\n}\n```\n\n'.repeat(5)}

## Lists

${Array(20).fill(0).map((_, i) => `${i + 1}. List item ${i + 1}\n`).join('')}

## Conclusion

This concludes the performance test document.`;

export const LargeContent: Story = {
  args: {
    content: largeMarkdown,
    streaming: true,
    animation: 'fade-in',
    animationDuration: 200,
    animationTimingFunction: 'ease-out',
    separator: 'character',
    charactersPerSecond: 300
  }
};

// Error handling story
export const EmptyContent: Story = {
  args: {
    content: '',
    streaming: true,
    animation: 'fade-in',
    animationDuration: 300,
    animationTimingFunction: 'ease-out',
    separator: 'character',
    charactersPerSecond: 100
  }
};

// Minimal content story
export const MinimalContent: Story = {
  args: {
    content: 'Hello, world!',
    streaming: true,
    animation: 'fade-in',
    animationDuration: 300,
    animationTimingFunction: 'ease-out',
    separator: 'character',
    charactersPerSecond: 100
  }
};