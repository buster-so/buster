import type { ReportElements } from '@buster/database';
import { describe, expect, it } from 'vitest';
import { markdownToPlatejs, platejsToMarkdown } from './platejs-conversions';

describe('markdownToPlatejs', () => {
  it('should convert elaborate markdown to platejs', async () => {
    const markdown = `# Welcome to the Plate Playground!

Experience a modern rich-text editor built with [Slate](https://slatejs.org) and [React](https://reactjs.org). This playground showcases just a part of Plate's capabilities. [Explore the documentation](/docs) to discover more.

## Collaborative Editing

Review and refine content seamlessly. Use [](/docs/suggestion) or to . Discuss changes using [comments](/docs/comment) on many text segments. You can even have  annotations!

## AI-Powered Editing

Boost your productivity with integrated [AI SDK](/docs/ai). Press <kbd>⌘+J</kbd> or <kbd>Space</kbd> in an empty line to:

* Generate content (continue writing, summarize, explain)
* Edit existing text (improve, fix grammar, change tone)

## Rich Content Editing

Structure your content with [headings](/docs/heading), [lists](/docs/list), and [quotes](/docs/blockquote). Apply [marks](/docs/basic-marks) like **bold**, _italic_, <u>underline</u>, ~~strikethrough~~, and \`code\`. Use [autoformatting](/docs/autoformat) for [Markdown](/docs/markdown)-like shortcuts (e.g., <kbd>\\*</kbd>  for lists, <kbd>#</kbd>  for H1).

> Blockquotes are great for highlighting important information.

\`\`\`javascript
function hello() {
  console.info('Code blocks are supported!');
}
\`\`\`

Create [links](/docs/link), [@mention](/docs/mention) users like [Alice](mention:Alice), or insert [emojis](/docs/emoji) ✨. Use the [slash command](/docs/slash-command) (/) for quick access to elements.

### How Plate Compares

Plate offers many features out-of-the-box as free, open-source plugins.

| **Feature**         | **Plate (Free & OSS)** | **Tiptap**            |
| ------------------- | ---------------------- | --------------------- |
| AI                  | ✅                      | Paid Extension        |
| Comments            | ✅                      | Paid Extension        |
| Suggestions         | ✅                      | Paid (Comments Pro)   |
| Emoji Picker        | ✅                      | Paid Extension        |
| Table of Contents   | ✅                      | Paid Extension        |
| Drag Handle         | ✅                      | Paid Extension        |
| Collaboration (Yjs) | ✅                      | Hocuspocus (OSS/Paid) |

### Images and Media

Embed rich media like images directly in your content. Supports [Media uploads](/docs/media) and [drag & drop](/docs/dnd) for a smooth experience.

![](https://images.unsplash.com/photo-1712688930249-98e1963af7bd?q=80\\&w=600\\&auto=format\\&fit=crop\\&ixlib=rb-4.0.3\\&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

<file isUpload="true" name="sample.pdf" src="https://s26.q4cdn.com/900411403/files/doc_downloads/test.pdf" />

<audio src="https://samplelib.com/lib/preview/mp3/sample-3s.mp3" />

### Table of Contents

<toc />

Here's an unordered list:

* First item with \`code snippet\`
* Second item with **bold text**
* Third item with _italic text_
* Nested item 1
* Nested item 2`;
    const platejs = await markdownToPlatejs(markdown);
    expect(platejs).toBeDefined();
  });
});

describe('platejsToMarkdown', () => {
  it('should convert platejs to markdown', async () => {
    const markdown = `This is a simple paragraph.\n`;
    const elements: ReportElements = [
      {
        type: 'p',
        children: [
          {
            text: 'This is a simple paragraph.',
          },
        ],
      },
    ];
    const markdown2 = await platejsToMarkdown(elements);
    expect(markdown2).toBe(markdown);
  });

  it('should convert callout platejs element to markdown', async () => {
    const elements: ReportElements = [
      {
        type: 'h1',
        children: [
          {
            text: 'Main Title',
          },
        ],
      },
      {
        type: 'p',
        children: [
          {
            text: 'This paragraph has ',
          },
          {
            text: 'bold text',
            bold: true,
          },
          {
            text: ' in it.',
          },
        ],
      },
    ];
    const markdown2 = await platejsToMarkdown(elements);
    const markdown = `# Main Title\n\nThis paragraph has **bold text** in it.\n`;
    expect(markdown2).toBe(markdown);
  });

  it('should convert callout platejs element to markdown', async () => {
    const elements: ReportElements = [
      {
        type: 'callout',
        icon: '⚠️',
        variant: 'warning',
        children: [
          {
            type: 'p' as const,
            children: [
              {
                text: 'This is a simple paragraph.',
              },
            ],
          },
        ],
      },
    ];
    const markdownFromPlatejs = await platejsToMarkdown(elements);

    const expectedMarkdown = `<callout icon="⚠️">This is a simple paragraph.\n</callout>\n`;
    expect(markdownFromPlatejs).toBe(expectedMarkdown);
  });
});
