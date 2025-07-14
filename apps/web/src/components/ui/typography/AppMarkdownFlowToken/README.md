# AppMarkdownStreamable

A React component that renders markdown content with smooth streaming animation effects, providing a typewriter-like experience where markdown content appears progressively.

## Features

- **Streaming Animation**: Smooth, typewriter-like rendering with configurable speed
- **Markdown Support**: Full support for headings, bold, italic, code blocks, lists, blockquotes, and links
- **Flexible Separators**: Animate by character, word, or diff
- **Customizable Animation**: Configurable duration and timing functions
- **TypeScript Support**: Fully typed with comprehensive interfaces
- **Performance Optimized**: Uses React memoization and efficient rendering

## Installation

This component is part of the project's UI library and uses the following dependencies:

- `react-markdown` - Markdown parsing and rendering
- `remark-gfm` - GitHub Flavored Markdown support
- `rehype-raw` - Raw HTML support in markdown
- `framer-motion` - Animation library
- `tailwindcss` - Styling

## Usage

### Basic Usage

```tsx
import { AppMarkdownStreamable } from '@/components/ui/typography/AppMarkdownFlowToken';

<AppMarkdownStreamable
  content="# Hello World\n\nThis is **streaming** markdown!"
  streaming={true}
/>
```

### Static Rendering (No Animation)

```tsx
<AppMarkdownStreamable
  content="# Static Content"
  streaming={false}
/>
```

### Word-by-Word Animation

```tsx
<AppMarkdownStreamable
  content="This will animate **word by word**"
  streaming={true}
  separator="word"
  charactersPerSecond={150}
/>
```

### Character-by-Character Animation

```tsx
<AppMarkdownStreamable
  content="This will animate *character by character*"
  streaming={true}
  separator="character"
  charactersPerSecond={100}
/>
```

### Custom Animation Settings

```tsx
<AppMarkdownStreamable
  content="# Custom Animation"
  streaming={true}
  animation="fade-in"
  animationDuration={500}
  animationTimingFunction="ease-in-out"
  charactersPerSecond={200}
/>
```

### With Custom Styling

```tsx
<AppMarkdownStreamable
  content="# Styled Content"
  streaming={true}
  className="bg-blue-50 p-4 rounded-lg"
  style={{ maxWidth: '600px' }}
/>
```

## Props

### AppMarkdownStreamableProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | **required** | Markdown content to render |
| `streaming` | `boolean` | **required** | Whether to enable streaming animation |
| `animation` | `'fade-in'` | `'fade-in'` | Animation type (currently only fade-in) |
| `animationDuration` | `number` | `300` | Animation duration in milliseconds |
| `animationTimingFunction` | `string` | `'ease-out'` | CSS timing function |
| `separator` | `'word' \| 'character' \| 'diff'` | `'character'` | How to separate content for animation |
| `charactersPerSecond` | `number` | `100` | Rate of character revelation |
| `className` | `string` | `undefined` | CSS class names |
| `style` | `React.CSSProperties` | `undefined` | Inline CSS styles |

## Supported Markdown Elements

- **Headings**: `# H1` through `###### H6`
- **Text Formatting**: `**bold**`, `*italic*`, `~~strikethrough~~`
- **Code**: `` `inline code` `` and ````code blocks````
- **Lists**: Ordered (`1.`) and unordered (`-`, `*`, `+`)
- **Blockquotes**: `> Quote text`
- **Links**: `[text](url)`
- **Line Breaks**: Standard markdown line breaks

## Animation Types

Currently supports:
- **fade-in**: Elements fade in as they appear (default)

Future enhancements planned:
- **slide-in**: Elements slide in from the side
- **scale-in**: Elements scale up as they appear
- **blur-in**: Elements blur in as they appear

## Separator Types

### Character (`separator="character"`)
Animates each character individually for a smooth typewriter effect.

### Word (`separator="word"`)
Animates each word as a unit, good for readable streaming.

### Diff (`separator="diff"`)
Animates line-by-line, useful for code diffs or structured content.

## Performance Considerations

- Uses React memoization to prevent unnecessary re-renders
- Efficient streaming logic with throttled updates
- Optimized markdown parsing with read-ahead detection
- Proper cleanup of intervals on unmount

## Testing

The component includes comprehensive tests covering:
- Basic rendering functionality
- Streaming animation behavior
- Different separator types
- Custom styling and props
- Edge cases (empty content, etc.)

Run tests with:
```bash
npm run test AppMarkdownStreamable
```

## Storybook

Interactive examples available in Storybook:
- Default streaming example
- No animation (static rendering)
- Word-by-word animation
- Different speed settings
- Custom styling examples
- Large content performance test

## Browser Support

Works in all modern browsers with support for:
- ES6+ JavaScript features
- CSS animations and transitions
- React 18+

## Contributing

When making changes to this component:

1. Update types in `types.ts` if adding new props
2. Add tests for new functionality
3. Update Storybook stories for visual testing
4. Ensure proper TypeScript typing
5. Follow existing code patterns and naming conventions

## License

Part of the Buster project's UI component library.