import React from 'react';
import AppMarkdownStreaming from './AppMarkdownStreaming';
import type { Meta, StoryObj } from '@storybook/react';
import { useStreamTokenArray } from '@llm-ui/react';
import type { MarkdownAnimation } from '../../typography/animation-common';

const meta: Meta<typeof AppMarkdownStreaming> = {
  title: 'UI/Typography/AppMarkdownStreaming',
  component: AppMarkdownStreaming
};
export default meta;

type Story = StoryObj<typeof AppMarkdownStreaming>;

const redRisingPoemTokenArray = [
  {
    token: '\n\n# TEST\n\n',
    delayMs: 1000
  },
  // {
  //   token: "## Red Rising: The Reaper's Code (Pierce Brown)\n\n",
  //   delayMs: 2500
  // },
  // {
  //   token: '\n\n## PAUSE (2 seconds)\n\n',
  //   delayMs: 2000
  // },
  {
    token:
      '```yaml\n' +
      'name: Red Rising\n' +
      'author: Pierce Brown\n' +
      'genre: Science Fiction\n' +
      'published: 2014\n' +
      'series:\n' +
      '  - title: Red Rising\n' +
      '    year: 2014\n' +
      '  - title: Golden Son\n' +
      '    year: 2015\n' +
      '  - title: Morning Star\n' +
      '    year: 2016\n' +
      'themes:\n' +
      '  - power\n' +
      '  - rebellion\n' +
      '  - identity\n' +
      '```\n\n',
    delayMs: 2000
  }
  /*  {
    token:
      'Pierce Brown, the author of the *"Red Rising"* series, is a celebrated `American` science fiction writer known for his captivating storytelling and intricate world-building. Born on January 28, 1988, in Denver, Colorado, Brown developed a passion for writing at a young age, inspired by the works of **J.R.R. Tolkien** and **George R.R. Martin**. He pursued his `education` at *Pepperdine University*, where he honed his skills in political science and economics, which later influenced the complex socio-political landscapes in his novels. Brown\'s debut novel, *"Red Rising,"* published in 2014, quickly gained a dedicated following, praised for its gripping narrative and richly developed characters. The series, set in a dystopian future where society is divided by color-coded castes, explores themes of power, rebellion, and identity. Brown\'s ability to weave intense action with profound philosophical questions has earned him critical acclaim and a loyal fanbase. Beyond writing, Brown is known for his engaging presence on social media, where he interacts with fans and shares insights into his creative process. His work continues to resonate with readers worldwide, solidifying his place as a prominent voice in contemporary science fiction literature.',
    delayMs: 2000
  },
  {
    token: '\n\n## PAUSE (2 seconds)\n\n',
    delayMs: 2000
  },
  {
    token: '# PAUSE (1 second)\n\n',
    delayMs: 1000
  },
  {
    token: '## PAUSE 30 seconds\n\n',
    delayMs: 2000
  },
  {
    token: '## PAUSE 30 seconds\n\n',
    delayMs: 2000
  }
    */
];

const actualTokenArray = [
  {
    token:
      "Let me start by thinking through the TODO items to understand what's needed to identify the top customer.\n\n",
    delayMs: 100
  },
  {
    token: '1. **Determine how a "customer" is identified**\n',
    delayMs: 500
  },
  {
    token:
      "Looking at the database context, I can see there's a `customer` model that serves as the comprehensive customer model for customer relationship management and purchase behavior analysis. ",
    delayMs: 300
  },
  {
    token: 'The customer is identified by `customerid` which is a unique identifier. ',
    delayMs: 600
  },
  {
    token:
      'The customer model also has relationships to `person` (for individual customers) and `store` (for store customers), as well as connections to `sales_order_header` for tracking customer orders. ',
    delayMs: 500
  },
  {
    token: 'This gives me a clear way to identify customers in the system.\n\n',
    delayMs: 1000
  },
  // {
  //   token: '## PAUSE 400ms seconds\n\n',
  //   delayMs: 400
  // },
  {
    token: '2. **Determine metric for "top customer"**\n',
    delayMs: 500
  },
  {
    token:
      'The user is asking for their "top customer" which typically means the customer who has generated the most value for the business. ',
    delayMs: 700
  },
  {
    token: 'Looking at the available precomputed metrics, I can see several relevant options:\n',
    delayMs: 500
  },
  {
    token:
      '- `customer_all_time_clv` - calculates total revenue generated by each customer over their entire history\n',
    delayMs: 600
  },
  {
    token:
      '- `customer_lifetime_value` - estimates total revenue a business can expect from a customer throughout their relationship\n',
    delayMs: 600
  },
  {
    token: '- `customer_lifetime_orders` - tracks total lifetime orders\n\n',
    delayMs: 500
  },
  {
    token:
      'The most appropriate metric would be total revenue generated, which aligns with the `customer_all_time_clv` model that calculates "the total revenue generated by each customer over their entire history." ',
    delayMs: 900
  },
  {
    token:
      'This is the most direct measure of who the "top customer" would be from a business value perspective.\n\n',
    delayMs: 600
  },
  {
    token: '3. **Determine the visualization type and axes**\n',
    delayMs: 500
  },
  {
    token:
      'Since the user is asking for "my top customer" (singular), this indicates they want to identify a single customer. ',
    delayMs: 700
  },
  {
    token:
      'According to the visualization guidelines, when a user requests a single item based on a metric (like "the top customer"), I should use a number card that displays both the item\'s name and metric value. ',
    delayMs: 900
  },
  {
    token:
      'This would show something like "Top Customer: [Customer Name] - $[Revenue Amount]".\n\n',
    delayMs: 600
  },
  {
    token:
      "Now that I've considered the TODO items, I need to determine if further reasoning or validation is needed. ",
    delayMs: 700
  },
  {
    token: 'All three TODO items appear to be well-supported by the available documentation:\n',
    delayMs: 500
  },
  {
    token: '- Customer identification is clear through the customer model\n',
    delayMs: 400
  },
  {
    token: '- The metric is available through the precomputed customer_all_time_clv model\n',
    delayMs: 400
  },
  {
    token:
      '- The visualization type is clearly defined by the guidelines for singular requests\n\n',
    delayMs: 500
  },
  {
    token: 'The documentation appears sufficient to conclude my prep work. ',
    delayMs: 600
  },
  {
    token:
      'I have a clear path forward: use the customer_all_time_clv precomputed metric to identify the customer with the highest total lifetime value, and display this in a number card format showing both the customer identifier and their total revenue value.',
    delayMs: 1000
  }
];

const StreamingDemo: React.FC<{ animation: MarkdownAnimation }> = ({ animation }) => {
  const { isStreamFinished, output } = useStreamTokenArray([
    ...redRisingPoemTokenArray,
    ...actualTokenArray
  ]);

  return (
    <div className="flex w-full space-y-4 space-x-4">
      <div className="w-1/2">
        <AppMarkdownStreaming
          content={output}
          isStreamFinished={isStreamFinished}
          animation={animation}
        />
      </div>
      <div className="flex w-1/2 flex-col space-y-2 rounded-md border border-gray-200 p-4">
        <h1 className="bg-gray-100 p-2 text-2xl font-bold">ACTUAL OUTPUT FROM LLM</h1>
        <div className="border border-gray-400 p-4">
          <pre className="text-sm whitespace-pre-wrap">{output}</pre>
        </div>
      </div>
    </div>
  );
};

export const Default: Story = {
  render: () => <StreamingDemo animation="blurIn" />
};

export const NoAnimation: Story = {
  render: () => {
    const output = [
      ...redRisingPoemTokenArray
      //...actualTokenArray
    ]
      .map((token) => token.token)
      .join('');
    const isStreamFinished = true;

    return (
      <div className="w-1/2">
        <AppMarkdownStreaming
          content={output}
          isStreamFinished={isStreamFinished}
          animation={'fadeIn'}
          animationDuration={700}
          animationTimingFunction="ease-in-out"
        />
      </div>
    );
  }
};

// Complex markdown token array with every type of markdown and varying chunk sizes
const complexMarkdownTokenArray = [
  // Small chunks for title
  { token: '#', delayMs: 50 },
  { token: ' ', delayMs: 50 },
  { token: 'C', delayMs: 50 },
  { token: 'o', delayMs: 50 },
  { token: 'm', delayMs: 50 },
  { token: 'p', delayMs: 50 },
  { token: 'r', delayMs: 50 },
  { token: 'e', delayMs: 50 },
  { token: 'h', delayMs: 50 },
  { token: 'e', delayMs: 50 },
  { token: 'n', delayMs: 50 },
  { token: 's', delayMs: 50 },
  { token: 'i', delayMs: 50 },
  { token: 'v', delayMs: 50 },
  { token: 'e', delayMs: 50 },
  { token: ' Markdown', delayMs: 100 },
  { token: ' Showcase\n\n', delayMs: 200 },

  // Medium chunk for intro
  { token: 'This document demonstrates **all** markdown features with ', delayMs: 300 },
  { token: '*various* chunk sizes during streaming.\n\n', delayMs: 200 },

  // Headers section - large chunk
  {
    token:
      '## Headers\n\n# H1 Header\n## H2 Header\n### H3 Header\n#### H4 Header\n##### H5 Header\n###### H6 Header\n\n',
    delayMs: 500
  },

  // Text formatting - mixed chunks
  { token: '## Text Formatting\n\n', delayMs: 200 },
  { token: 'This is **bold text** and this is ', delayMs: 150 },
  { token: '*italic text*', delayMs: 100 },
  { token: '. You can also use ', delayMs: 100 },
  { token: '***bold and italic***', delayMs: 150 },
  { token: " together. Here's some ", delayMs: 100 },
  { token: '`inline code`', delayMs: 100 },
  { token: ' and ~~strikethrough text~~.\n\n', delayMs: 200 },

  // Lists - varying chunks
  { token: '## Lists\n\n### Unordered List\n', delayMs: 200 },
  { token: '- ', delayMs: 50 },
  { token: 'First item\n', delayMs: 100 },
  { token: '- Second item\n', delayMs: 100 },
  { token: '  - Nested item 1\n  - Nested item 2\n', delayMs: 200 },
  { token: '- Third item\n\n', delayMs: 150 },

  // Ordered list - large chunk
  {
    token:
      '### Ordered List\n1. First step\n2. Second step\n   1. Sub-step A\n   2. Sub-step B\n3. Third step\n\n',
    delayMs: 400
  },

  // Task list - medium chunks
  { token: '### Task List\n', delayMs: 100 },
  { token: '- [x] Completed task\n', delayMs: 150 },
  { token: '- [ ] Pending task\n', delayMs: 150 },
  { token: '- [x] Another completed task\n\n', delayMs: 200 },

  // Links and images
  { token: '## Links and Images\n\n', delayMs: 200 },
  { token: "Here's a [link to GitHub](https://github.com) and ", delayMs: 200 },
  { token: 'an image:\n\n![Alt text](https://picsum.photos/200)\n\n', delayMs: 300 },

  // Blockquote - single large chunk
  {
    token:
      '## Blockquotes\n\n> This is a blockquote.\n> It can span multiple lines.\n>\n> > And can be nested too!\n\n',
    delayMs: 400
  },

  // Code blocks - varying sizes
  { token: '## Code Blocks\n\n', delayMs: 150 },
  { token: '```', delayMs: 50 },
  { token: 'javascript\n', delayMs: 100 },
  { token: 'function ', delayMs: 50 },
  { token: 'greet(name) {\n', delayMs: 100 },
  { token: '  console.swag(`Hello, ${name}!`);\n', delayMs: 150 },
  { token: '}\n\ngreet("World");\n```\n\n', delayMs: 200 },

  // Python code block - large chunk
  {
    token:
      '```python\ndef fibonacci(n):\n    """Generate Fibonacci sequence"""\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b\n\n# Print first 10 numbers\nfor num in fibonacci(10):\n    print(num)\n```\n\n',
    delayMs: 500
  },

  // Table - character by character for effect
  { token: '## Tables\n\n', delayMs: 200 },
  { token: '|', delayMs: 50 },
  { token: ' Header 1 ', delayMs: 100 },
  { token: '|', delayMs: 50 },
  { token: ' Header 2 ', delayMs: 100 },
  { token: '|', delayMs: 50 },
  { token: ' Header 3 ', delayMs: 100 },
  { token: '|\n', delayMs: 50 },
  { token: '|----------|----------|----------|\n', delayMs: 200 },
  { token: '| Cell 1   | Cell 2   | Cell 3   |\n', delayMs: 200 },
  { token: '| Data A   | Data B   | Data C   |\n', delayMs: 200 },
  { token: '| Info X   | Info Y   | Info Z   |\n\n', delayMs: 200 },

  // Horizontal rule
  { token: '## Horizontal Rule\n\nAbove the line\n\n---\n\nBelow the line\n\n', delayMs: 300 },

  // Mixed content - large chunk
  {
    token:
      "## Complex Example\n\nHere's a paragraph with **bold**, *italic*, and `code` mixed together. We can reference [links](https://example.com) and use math expressions like $E = mc^2$.\n\n",
    delayMs: 400
  },

  // Nested structures
  { token: '### Nested Structures\n\n', delayMs: 150 },
  { token: '1. **First item** with *emphasis*\n', delayMs: 200 },
  { token: '   - Sub-point with `code`\n', delayMs: 150 },
  { token: '   - Another sub-point\n', delayMs: 150 },
  { token: '     > Nested quote\n', delayMs: 150 },
  { token: '2. Second item\n', delayMs: 100 },
  { token: '   ```bash\n   echo "Nested code block"\n   ```\n\n', delayMs: 300 },

  // Math expressions (if supported)
  { token: '## Math Expressions\n\n', delayMs: 200 },
  { token: 'Inline math: $x^2 + y^2 = z^2$\n\n', delayMs: 200 },
  { token: 'Block math:\n\n', delayMs: 100 },
  { token: '$$\n\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n$$\n\n', delayMs: 300 },

  // HTML (if supported)
  { token: '## HTML Elements\n\n', delayMs: 200 },
  { token: '<details>\n<summary>Click to expand</summary>\n\n', delayMs: 200 },
  { token: 'Hidden content with **markdown** inside!\n\n</details>\n\n', delayMs: 300 },

  // Emojis and special characters
  { token: '## Special Characters\n\n', delayMs: 200 },
  { token: 'Emojis: 😀 🚀 ⭐ 🎉\n', delayMs: 150 },
  { token: 'Symbols: © ® ™ § ¶\n', delayMs: 150 },
  { token: 'Arrows: → ← ↑ ↓ ↔\n\n', delayMs: 200 },

  // Final message - character by character
  { token: '---\n\n', delayMs: 200 },
  { token: '*', delayMs: 50 },
  { token: 'T', delayMs: 50 },
  { token: 'h', delayMs: 50 },
  { token: 'e', delayMs: 50 },
  { token: ' ', delayMs: 50 },
  { token: 'E', delayMs: 50 },
  { token: 'n', delayMs: 50 },
  { token: 'd', delayMs: 50 },
  { token: '*', delayMs: 50 },
  { token: ' 🎭', delayMs: 100 }
];

export const ComplexStream: Story = {
  render: () => {
    const { isStreamFinished, output } = useStreamTokenArray(complexMarkdownTokenArray);

    return (
      <div className="flex w-full space-y-4 space-x-4">
        <div className="w-1/2">
          <AppMarkdownStreaming
            content={output}
            isStreamFinished={isStreamFinished}
            animation="fadeIn"
            animationDuration={700}
            animationTimingFunction="ease-in-out"
          />
        </div>
        <div className="flex w-1/2 flex-col space-y-2 rounded-md border border-gray-200 p-4">
          <h1 className="bg-gray-100 p-2 text-2xl font-bold">STREAMING OUTPUT</h1>
          <div className="max-h-[600px] overflow-y-auto border border-gray-400 p-4">
            <pre className="text-sm whitespace-pre-wrap">{output}</pre>
          </div>
          <div className="text-sm text-gray-600">
            Stream Status: {isStreamFinished ? '✅ Complete' : '⏳ Streaming...'}
          </div>
        </div>
      </div>
    );
  }
};

// Test case for the paragraph-to-list transition bug
const paragraphToListTransitionTokens = [
  {
    token: 'This gives me a clear way to identify customers in the system.\n\n',
    delayMs: 500
  },
  {
    token: '2. **Determine metric for "top customer"**\n',
    delayMs: 500
  },
  {
    token: 'Looking at the available precomputed metrics, I can see several relevant options:\n',
    delayMs: 500
  },
  {
    token: '- `customer_all_time_clv` - calculates total revenue generated by each customer\n',
    delayMs: 500
  },
  {
    token: '- `customer_lifetime_value` - estimates total revenue from a customer\n',
    delayMs: 500
  },
  {
    token: '- `customer_lifetime_orders` - tracks total lifetime orders\n\n',
    delayMs: 500
  },
  {
    token: 'The most appropriate metric would be total revenue generated.\n\n',
    delayMs: 500
  },
  {
    token: '3. **Determine the visualization type**\n',
    delayMs: 500
  },
  {
    token: 'Since the user is asking for a single customer, a number card would be best.',
    delayMs: 500
  }
];

export const ParagraphToListTransition: Story = {
  render: () => {
    const { isStreamFinished, output } = useStreamTokenArray(paragraphToListTransitionTokens);

    return (
      <div className="flex flex-col space-y-4">
        <div className="text-lg font-bold">Testing Paragraph to List Transition Animation Bug</div>
        <div className="mb-4 text-sm text-gray-600">
          Watch for animation retriggering when transitioning from paragraph to numbered list
        </div>
        <div className="flex w-full space-x-4">
          <div className="w-1/2">
            <h3 className="mb-2 font-semibold">Animated Output</h3>
            <div className="rounded border border-gray-300 p-4">
              <AppMarkdownStreaming
                content={output}
                isStreamFinished={isStreamFinished}
                animation="blurIn"
                animationDuration={700}
                animationTimingFunction="ease-in-out"
              />
            </div>
          </div>
          <div className="w-1/2">
            <h3 className="mb-2 font-semibold">Raw Streaming Content</h3>
            <div className="rounded border border-gray-300 p-4">
              <pre className="font-mono text-sm whitespace-pre-wrap">{output}</pre>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Stream Status: {isStreamFinished ? '✅ Complete' : '⏳ Streaming...'}
            </div>
          </div>
        </div>
      </div>
    );
  }
};

// Test case for broken up inline code streaming
const brokenInlineCodeTokens = [
  {
    token: 'This paragraph contains several inline code examples. Here is a complete ',
    delayMs: 300
  },
  {
    token: '`complete_code_block`',
    delayMs: 200
  },
  {
    token: ' HOLD ',
    delayMs: 1000
  },
  {
    token: " that arrives in one token. Now let's test broken inline code: ",
    delayMs: 300
  },
  {
    token: '`br',
    delayMs: 400
  },
  {
    token: 'oken',
    delayMs: 2000
  },
  {
    token: '_code',
    delayMs: 250
  },
  {
    token: '_block',
    delayMs: 260
  },
  {
    token: '`',
    delayMs: 650
  },
  {
    token: " where the backticks and content are split. Here's another example with ",
    delayMs: 300
  },
  {
    token: '`',
    delayMs: 500
  },
  {
    token: 'useState',
    delayMs: 200
  },
  {
    token: '`',
    delayMs: 400
  },
  {
    token: ' and ',
    delayMs: 150
  },
  {
    token: '`',
    delayMs: 300
  },
  {
    token: 'useEffect',
    delayMs: 200
  },
  {
    token: '`',
    delayMs: 300
  },
  {
    token: ' hooks. Sometimes the content itself is split like ',
    delayMs: 300
  },
  {
    token: '`',
    delayMs: 200
  },
  {
    token: 'customer',
    delayMs: 150
  },
  {
    token: '_all',
    delayMs: 150
  },
  {
    token: '_time',
    delayMs: 150
  },
  {
    token: '_clv',
    delayMs: 150
  },
  {
    token: '`',
    delayMs: 200
  },
  {
    token: ' and we need to wait for all parts to complete the inline code block.\n\n',
    delayMs: 400
  },
  {
    token: 'Another paragraph with more examples: ',
    delayMs: 200
  },
  {
    token: '`',
    delayMs: 300
  },
  {
    token: 'const',
    delayMs: 150
  },
  {
    token: ' result',
    delayMs: 150
  },
  {
    token: ' =',
    delayMs: 100
  },
  {
    token: ' await',
    delayMs: 150
  },
  {
    token: ' fetch',
    delayMs: 150
  },
  {
    token: '()',
    delayMs: 100
  },
  {
    token: '`',
    delayMs: 300
  },
  {
    token: ' shows how complex code can be streamed. Mixed with normal ',
    delayMs: 300
  },
  {
    token: '`simple`',
    delayMs: 150
  },
  {
    token: ' inline code that arrives complete.\n\n',
    delayMs: 200
  },
  {
    token: 'Final test case: ',
    delayMs: 200
  },
  {
    token: '`',
    delayMs: 400
  },
  {
    token: 'database',
    delayMs: 200
  },
  {
    token: '.query',
    delayMs: 150
  },
  {
    token: '("SELECT',
    delayMs: 150
  },
  {
    token: ' * FROM',
    delayMs: 150
  },
  {
    token: ' customers',
    delayMs: 150
  },
  {
    token: ' WHERE',
    delayMs: 150
  },
  {
    token: ' active',
    delayMs: 150
  },
  {
    token: ' = true")',
    delayMs: 200
  },
  {
    token: '`',
    delayMs: 300
  },
  {
    token: ' demonstrates SQL code streaming.',
    delayMs: 200
  },
  {
    token: 'HOLD',
    delayMs: 50000
  }
];

export const InlineCodeStreaming: Story = {
  render: () => {
    const { isStreamFinished, output } = useStreamTokenArray(brokenInlineCodeTokens);

    return (
      <div className="flex flex-col space-y-4">
        <div className="text-lg font-bold">Testing Broken Inline Code Streaming</div>
        <div className="mb-4 text-sm text-gray-600">
          Watch how inline code renders when backticks and content are split across multiple stream
          tokens
        </div>
        <div className="flex w-full space-x-4">
          <div className="w-1/2">
            <h3 className="mb-2 font-semibold">Animated Output</h3>
            <div className="rounded border border-gray-300 p-4">
              <AppMarkdownStreaming
                content={output}
                isStreamFinished={isStreamFinished}
                animation="fadeIn"
                animationDuration={500}
                animationTimingFunction="ease-in-out"
              />
            </div>
          </div>
          <div className="w-1/2">
            <h3 className="mb-2 font-semibold">Raw Streaming Content</h3>
            <div className="max-h-[400px] overflow-y-auto rounded border border-gray-300 p-4">
              <pre className="font-mono text-sm whitespace-pre-wrap">{output}</pre>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Stream Status: {isStreamFinished ? '✅ Complete' : '⏳ Streaming...'}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Current length: {output.length} characters
            </div>
          </div>
        </div>
      </div>
    );
  }
};
