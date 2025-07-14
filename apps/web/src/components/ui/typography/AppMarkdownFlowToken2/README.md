# AppMarkdownFlowToken2

A streaming animation library inspired by FlowToken that provides smooth character-by-character animation for LLM output with throttling capabilities.

## Features

- **Streaming Animation**: Character-by-character text animation with configurable speed
- **Throttling**: Control text output rate (characters per minute) to simulate LLM streaming
- **Markdown Support**: Full markdown parsing and rendering with animations
- **FlowToken Compatibility**: Maintains API compatibility with original FlowToken
- **Code Blocks**: Syntax-highlighted code blocks with streaming animation
- **Images**: Streaming-aware image loading with fade effects
- **Responsive**: Works across all screen sizes

## Installation

```bash
# Component is already part of the project
import { AppMarkdownFlowToken2 } from '@/components/ui/typography/AppMarkdownFlowToken2';
```

## Basic Usage

```tsx
import { AppMarkdownFlowToken2 } from '@/components/ui/typography/AppMarkdownFlowToken2';

function MyComponent() {
  return (
    <AppMarkdownFlowToken2
      content="Hello, this is streaming text!"
      isStreaming={true}
      throttleRate={500}
      cursor={true}
      speed={50}
    />
  );
}
```

## Props

### FlowToken Compatibility Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | Required | The text/markdown content to animate |
| `speed` | `number` | `50` | Animation speed in milliseconds |
| `cursor` | `boolean` | `true` | Show blinking cursor |
| `cursorChar` | `string` | `|` | Character to use for cursor |
| `cursorClassName` | `string` | - | CSS class for cursor styling |
| `className` | `string` | - | CSS class for container |
| `onComplete` | `() => void` | - | Callback when animation completes |

### Enhanced Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `throttleRate` | `number` | `500` | Characters per minute for throttling |
| `isStreaming` | `boolean` | `false` | Whether content is currently streaming |
| `enableThrottling` | `boolean` | `true` | Enable/disable throttling |
| `animationType` | `'fade' \| 'slide' \| 'typewriter' \| 'none'` | `'typewriter'` | Animation style |
| `renderCodeBlocks` | `boolean` | `true` | Enable code block rendering |
| `renderImages` | `boolean` | `true` | Enable image rendering |
| `renderLinks` | `boolean` | `true` | Enable link rendering |

## Examples

### Basic Text Animation

```tsx
<AppMarkdownFlowToken2
  content="This text will appear character by character"
  speed={30}
  cursor={true}
  animationType="typewriter"
/>
```

### Streaming LLM Response

```tsx
function StreamingResponse() {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  
  return (
    <AppMarkdownFlowToken2
      content={content}
      isStreaming={isStreaming}
      throttleRate={600}
      onComplete={() => setIsStreaming(false)}
    />
  );
}
```

### Markdown Content

```tsx
<AppMarkdownFlowToken2
  content={`# Hello World

This is **bold** and *italic* text.

\`\`\`javascript
function greet() {
  console.log("Hello!");
}
\`\`\`

- Item 1
- Item 2
- Item 3
`}
  isStreaming={true}
  throttleRate={400}
  renderCodeBlocks={true}
  renderImages={true}
  renderLinks={true}
/>
```

### Fast Animation (No Throttling)

```tsx
<AppMarkdownFlowToken2
  content="This appears quickly"
  enableThrottling={false}
  speed={10}
  animationType="fade"
/>
```

### Custom Styling

```tsx
<AppMarkdownFlowToken2
  content="Custom styled text"
  className="text-blue-500 bg-gray-100 p-4 rounded"
  cursorClassName="text-red-500"
  animationType="slide"
/>
```

## Individual Components

You can also use individual components directly:

```tsx
import { 
  AnimatedText, 
  AnimatedMarkdown, 
  AnimatedCodeBlock,
  AnimatedImage,
  useStreamingThrottle 
} from '@/components/ui/typography/AppMarkdownFlowToken2';

// Just animated text
<AnimatedText
  content="Simple text animation"
  isStreaming={true}
  throttleRate={500}
/>

// Just markdown
<AnimatedMarkdown
  markdown="# Title\n\nContent here"
  isStreaming={true}
/>

// Just code block
<AnimatedCodeBlock
  code="console.log('Hello');"
  language="javascript"
  isStreaming={true}
/>
```

## Hooks

### useStreamingThrottle

Core hook for managing streaming and throttling:

```tsx
import { useStreamingThrottle } from '@/components/ui/typography/AppMarkdownFlowToken2';

function CustomComponent() {
  const {
    displayedContent,
    isAnimating,
    progress,
    pause,
    resume,
    skip
  } = useStreamingThrottle({
    content: "Your content here",
    throttleRate: 500,
    isStreaming: true,
    onComplete: () => console.log('Done!')
  });
  
  return (
    <div>
      <div>{displayedContent}</div>
      <button onClick={pause}>Pause</button>
      <button onClick={resume}>Resume</button>
      <button onClick={skip}>Skip</button>
      <div>Progress: {Math.round(progress * 100)}%</div>
    </div>
  );
}
```

## Animation Types

- **`typewriter`**: Characters appear one by one with slight opacity animation
- **`fade`**: Characters fade in smoothly
- **`slide`**: Characters slide in from the right
- **`none`**: No animation, text appears immediately

## Throttling

The throttling system controls how fast text appears:

- **`throttleRate`**: Characters per minute (default: 500)
- **`isStreaming`**: When true, respects throttle rate
- **`enableThrottling`**: Can disable throttling entirely

### Throttling Logic

1. **Initially not streaming**: Display content immediately
2. **Starts streaming**: Begin throttled animation
3. **Stops streaming**: Continue animation until complete
4. **New content while streaming**: Queue new content, continue animation

## Performance

- **Optimized for long content**: Handles large text efficiently
- **Minimal re-renders**: Uses React.memo and useMemo appropriately
- **Cleanup**: Properly cleans up timers and intervals

## Accessibility

- **Screen readers**: Text is accessible as it appears
- **Keyboard navigation**: All interactive elements are keyboard accessible
- **Color contrast**: Uses system colors for accessibility

## Storybook

Run Storybook to see interactive examples:

```bash
pnpm run storybook
```

Stories include:
- Basic text animation
- Throttled streaming
- Markdown content
- Code blocks
- Interactive demo with controls

## Contributing

When adding new features:

1. Update TypeScript types in `types/index.ts`
2. Add utilities to appropriate `utils/` files
3. Create/update components in `components/`
4. Add Storybook stories
5. Update this README