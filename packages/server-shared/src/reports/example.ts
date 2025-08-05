import type { ReportElement } from '@buster/database';

export const SAMPLE_REPORT_ELEMENTS = [
  {
    type: 'h1', // This will now error if you use 'h1xs'
    children: [{ text: 'Welcome to the Report Editor' }],
  },
  {
    type: 'p',
    children: [
      { text: 'This is a sample paragraph with ' },
      { text: 'bold text', bold: true },
      { text: ' and ' },
      { text: 'italic text', italic: true },
      { text: '.' },
      { text: 'hilight', highlight: true },
    ],
  },
  {
    type: 'h2',
    children: [{ text: 'Features' }],
  },
  {
    type: 'ul',
    children: [
      { type: 'li', children: [{ text: 'Rich text editing' }] },
      { type: 'li', children: [{ text: 'Multiple block types' }] },
      { type: 'li', children: [{ text: 'Customizable appearance' }] },
    ],
  },
  {
    type: 'callout',
    variant: 'info',
    children: [{ text: 'This is an info callout with custom styling!' }],
  },
  {
    type: 'h3', // This is now valid - TypeScript knows this is a valid HeadingType
    children: [{ text: 'Title' }],
  },
  // Uncommenting this would cause a TypeScript error:
  // {
  //   type: 'xxxh3', // Error: Type '"xxxh3"' is not assignable to type ReportElementType
  //   children: [{ text: 'Invalid' }]
  // },
  {
    type: 'blockquote',
    children: [
      { text: 'This is a blockquote. It can contain styled text and other inline elements.' },
    ],
  },
  {
    type: 'code_block',
    lang: 'javascript',
    children: [
      {
        type: 'code_line',
        children: [{ text: 'const greeting = "Hello, World!";' }],
      },
      {
        type: 'code_line',
        children: [{ text: 'console.log(greeting);' }],
      },
      {
        type: 'code_line',
        children: [{ text: '}' }],
      },
    ],
  },
  {
    children: [
      { children: [{ text: 'function hello() {' }], type: 'code_line' },
      {
        children: [{ text: "  console.info('Code blocks are supported!');" }],
        type: 'code_line',
      },
      { children: [{ text: '}' }], type: 'code_line' },
    ],
    lang: 'javascript',
    type: 'code_block',
  },

  {
    type: 'h1',
    children: [{ text: 'Hello' }],
  },
  // Table Section
  {
    children: [{ text: 'How Plate Compares' }],
    type: 'h3',
  },
  {
    children: [
      {
        text: 'Plate offers many features out-of-the-box as free, open-source plugins.',
      },
    ],
    type: 'p',
  },
  {
    type: 'table',
    children: [
      {
        children: [
          {
            children: [{ bold: true, text: 'Feature' }],
            type: 'th',
          },
          {
            children: [
              {
                children: [{ bold: true, text: 'Plate (Free & OSS)' }],
                type: 'p',
              },
            ],
            type: 'th',
          },
          {
            children: [{ children: [{ bold: true, text: 'Tiptap' }], type: 'p' }],
            type: 'th',
          },
        ],
        type: 'tr',
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'AI' }], type: 'p' }],
            type: 'td',
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p',
              },
            ],
            type: 'td',
          },
          {
            children: [{ children: [{ text: 'Paid Extension' }], type: 'p' }],
            type: 'td',
          },
        ],
        type: 'tr',
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Comments' }], type: 'p' }],
            type: 'td',
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p',
              },
            ],
            type: 'td',
          },
          {
            children: [{ children: [{ text: 'Paid Extension' }], type: 'p' }],
            type: 'td',
          },
        ],
        type: 'tr',
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Suggestions' }], type: 'p' }],
            type: 'td',
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p',
              },
            ],
            type: 'td',
          },
          {
            children: [{ children: [{ text: 'Paid (Comments Pro)' }], type: 'p' }],
            type: 'td',
          },
        ],
        type: 'tr',
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Emoji Picker' }], type: 'p' }],
            type: 'td',
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p',
              },
            ],
            type: 'td',
          },
          {
            children: [{ children: [{ text: 'Paid Extension' }], type: 'p' }],
            type: 'td',
          },
        ],
        type: 'tr',
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Table of Contents' }], type: 'p' }],
            type: 'td',
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p',
              },
            ],
            type: 'td',
          },
          {
            children: [{ children: [{ text: 'Paid Extension' }], type: 'p' }],
            type: 'td',
          },
        ],
        type: 'tr',
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Drag Handle' }], type: 'p' }],
            type: 'td',
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p',
              },
            ],
            type: 'td',
          },
          {
            children: [{ children: [{ text: 'Paid Extension' }], type: 'p' }],
            type: 'td',
          },
        ],
        type: 'tr',
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Collaboration (Yjs)' }], type: 'p' }],
            type: 'td',
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p',
              },
            ],
            type: 'td',
          },
          {
            children: [{ children: [{ text: 'Hocuspocus (OSS/Paid)' }], type: 'p' }],
            type: 'td',
          },
        ],
        type: 'tr',
      },
    ],
  },
  {
    type: 'metric',
    metricId: '123',
    children: [{ text: '' }],
    caption: [{ text: 'This is a metric' }],
  },
] satisfies ReportElement[];
