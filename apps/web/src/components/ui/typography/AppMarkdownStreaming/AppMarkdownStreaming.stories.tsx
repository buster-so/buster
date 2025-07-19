import React from 'react';
import AppMarkdownStreaming from './AppMarkdownStreaming';
import type { Meta, StoryObj } from '@storybook/react';
import { useStreamTokenArray } from '@llm-ui/react';
import type { MarkdownAnimation } from './AnimatedMarkdown/animation-helpers';

const meta: Meta<typeof AppMarkdownStreaming> = {
  title: 'UI/Typography/AppMarkdownStreaming',
  component: AppMarkdownStreaming
};
export default meta;

type Story = StoryObj<typeof AppMarkdownStreaming>;

const redRisingPoemTokenArray = [
  {
    token: '# TEST\n\n',
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
  },
  {
    token:
      'Pierce Brown, the author of the *"Red Rising"* series, is a celebrated American science fiction writer known for his captivating storytelling and intricate world-building. Born on January 28, 1988, in Denver, Colorado, Brown developed a passion for writing at a young age, inspired by the works of **J.R.R. Tolkien** and **George R.R. Martin**. He pursued his education at *Pepperdine University*, where he honed his skills in political science and economics, which later influenced the complex socio-political landscapes in his novels. Brown\'s debut novel, *"Red Rising,"* published in 2014, quickly gained a dedicated following, praised for its gripping narrative and richly developed characters. The series, set in a dystopian future where society is divided by color-coded castes, explores themes of power, rebellion, and identity. Brown\'s ability to weave intense action with profound philosophical questions has earned him critical acclaim and a loyal fanbase. Beyond writing, Brown is known for his engaging presence on social media, where he interacts with fans and shares insights into his creative process. His work continues to resonate with readers worldwide, solidifying his place as a prominent voice in contemporary science fiction literature.',
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
];

const StreamingDemo: React.FC<{ animation: MarkdownAnimation }> = ({ animation }) => {
  const { isStreamFinished, output } = useStreamTokenArray(redRisingPoemTokenArray);
  return (
    <div className="flex w-full space-y-4 space-x-4">
      <div className="w-1/2">
        <AppMarkdownStreaming
          content={output}
          isStreamFinished={isStreamFinished}
          animation={animation}
          animationDuration={700}
          animationTimingFunction="ease-in-out"
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
  render: () => <StreamingDemo animation="fadeIn" />
};

export const NoAnimation: Story = {
  render: () => {
    const output = redRisingPoemTokenArray.map((token) => token.token).join('');
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
  { token: '  console.log(`Hello, ${name}!`);\n', delayMs: 150 },
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
