import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AppMarkdownFlowToken2 } from './AppMarkdownFlowToken2';

const meta: Meta<typeof AppMarkdownFlowToken2> = {
  title: 'Typography/AppMarkdownFlowToken2',
  component: AppMarkdownFlowToken2,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: 'The content to animate',
    },
    speed: {
      control: 'number',
      description: 'Animation speed (FlowToken compatibility)',
    },
    cursor: {
      control: 'boolean',
      description: 'Show cursor (FlowToken compatibility)',
    },
    throttleRate: {
      control: 'number',
      description: 'Characters per minute throttling rate',
    },
    isStreaming: {
      control: 'boolean',
      description: 'Whether content is currently streaming',
    },
    enableThrottling: {
      control: 'boolean',
      description: 'Enable throttling functionality',
    },
    animationType: {
      control: 'select',
      options: ['fade', 'slide', 'typewriter', 'none'],
      description: 'Type of animation',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicText: Story = {
  args: {
    content: 'Hello, this is a basic text animation that demonstrates the streaming effect!',
    speed: 50,
    cursor: true,
    throttleRate: 500,
    isStreaming: false,
    enableThrottling: true,
    animationType: 'typewriter',
  },
};

export const ThrottledStreaming: Story = {
  args: {
    content: 'This demonstrates throttled streaming where text appears at a controlled rate, simulating how LLM responses would be displayed to users.',
    speed: 30,
    cursor: true,
    throttleRate: 300,
    isStreaming: true,
    enableThrottling: true,
    animationType: 'typewriter',
  },
};

export const MarkdownContent: Story = {
  args: {
    content: `# Welcome to Markdown Animation

This is a **bold** statement and this is *italic* text.

## Code Example

Here's some code:

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
  return "animated";
}
\`\`\`

## Lists

- First item
- Second item
- Third item

## Links

Check out [this link](https://example.com) for more information.

## Images

![Alt text](https://via.placeholder.com/150x100)

That's all for now!`,
    speed: 40,
    cursor: true,
    throttleRate: 400,
    isStreaming: true,
    enableThrottling: true,
    animationType: 'typewriter',
  },
};

export const CodeBlocksOnly: Story = {
  args: {
    content: `Here's a TypeScript function:

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const createUser = (data: Partial<User>): User => {
  return {
    id: generateId(),
    name: data.name || 'Unknown',
    email: data.email || 'no-email@example.com',
  };
};
\`\`\`

And here's some Python:

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
\`\`\``,
    speed: 30,
    cursor: true,
    throttleRate: 600,
    isStreaming: true,
    enableThrottling: true,
    animationType: 'typewriter',
  },
};

export const FastAnimation: Story = {
  args: {
    content: 'This is a fast animation that shows how quickly text can appear when throttling is disabled or set to a high rate.',
    speed: 10,
    cursor: true,
    throttleRate: 2000,
    isStreaming: false,
    enableThrottling: true,
    animationType: 'fade',
  },
};

export const NoAnimation: Story = {
  args: {
    content: 'This text appears immediately without any animation effects.',
    speed: 50,
    cursor: false,
    throttleRate: 500,
    isStreaming: false,
    enableThrottling: false,
    animationType: 'none',
  },
};

export const LongContent: Story = {
  args: {
    content: `This is a very long piece of content that demonstrates how the throttling system handles large amounts of text. It should stream at a consistent rate regardless of the content length. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.`,
    speed: 20,
    cursor: true,
    throttleRate: 800,
    isStreaming: true,
    enableThrottling: true,
    animationType: 'typewriter',
  },
};

// Interactive story with controls
export const InteractiveDemo: Story = {
  render: (args) => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [content, setContent] = useState(args.content);
    
    const handleStartStreaming = () => {
      setIsStreaming(true);
      setContent('');
      
      // Simulate streaming content
      const fullContent = `# Streaming Demo

This content is being **streamed** in real-time!

## Features
- Throttled animation
- Markdown support
- Code highlighting

\`\`\`javascript
// This code appears as it streams
function demo() {
  return "streaming!";
}
\`\`\`

Stream complete!`;
      
      let index = 0;
      const interval = setInterval(() => {
        if (index < fullContent.length) {
          setContent(fullContent.slice(0, index + 1));
          index++;
        } else {
          setIsStreaming(false);
          clearInterval(interval);
        }
      }, 50);
    };
    
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={handleStartStreaming}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Start Streaming
          </button>
          <button
            onClick={() => { setContent(''); setIsStreaming(false); }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
        
        <div className="border p-4 rounded-lg min-h-[200px] bg-gray-50">
          <AppMarkdownFlowToken2
            {...args}
            content={content}
            isStreaming={isStreaming}
          />
        </div>
      </div>
    );
  },
  args: {
    content: 'Click "Start Streaming" to see the animation in action!',
    speed: 40,
    cursor: true,
    throttleRate: 500,
    isStreaming: false,
    enableThrottling: true,
    animationType: 'typewriter',
  },
};