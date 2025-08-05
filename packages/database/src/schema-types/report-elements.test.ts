import { describe, expect, test } from 'vitest';
import {
  type HeaderElement,
  HeaderElementSchema,
  type ImageElement,
  type ListElement,
  ListElementSchema,
  ListItemElement,
  type ParagraphElement,
  ParagraphElementSchema,
  type ReportElements,
  ReportElementsSchema,
} from './report-elements';

describe('ParagraphElementSchema', () => {
  test('should parse anchor schema', () => {
    const baseTest: ParagraphElement = {
      children: [
        {
          text: 'Experience a modern rich-text editor built with ',
        },
        {
          children: [
            {
              text: 'Slate',
            },
          ],
          type: 'a',
          url: 'https://slatejs.org',
        },
        {
          text: ' and ',
        },
        {
          children: [
            {
              text: 'React',
            },
          ],
          type: 'a',
          url: 'https://reactjs.org',
        },
        {
          text: ". This playground showcases just a part of Plate's capabilities. ",
        },
        {
          children: [
            {
              text: 'Explore the documentation',
            },
          ],
          type: 'a',
          url: '/docs',
        },
        {
          text: ' to discover more.',
        },
      ],
      type: 'p',
    };

    const result = ParagraphElementSchema.safeParse(baseTest);
    expect(result.success).toBe(true);
  });

  test('should parse paragraph schema with mention', () => {
    const baseTest: ParagraphElement = {
      children: [
        {
          text: 'Create ',
        },
        {
          children: [
            {
              text: 'links',
            },
          ],
          type: 'a',
          url: '/docs/link',
        },
        {
          text: ', ',
        },
        {
          children: [
            {
              children: [
                {
                  text: '',
                },
              ],
              type: 'mention',
              value: 'mention',
            },
          ],
          type: 'a',
          url: '/docs/mention',
        },
        {
          text: ' users like ',
        },
        {
          children: [
            {
              text: '',
            },
          ],
          type: 'mention',
          value: 'Alice',
          key: 'Alice',
        },
        {
          text: ', or insert ',
        },
        {
          children: [
            {
              text: 'emojis',
            },
          ],
          type: 'a',
          url: '/docs/emoji',
        },
        {
          text: ' ✨. Use the ',
        },
        {
          children: [
            {
              text: 'slash command',
            },
          ],
          type: 'a',
          url: '/docs/slash-command',
        },
        {
          text: ' (/) for quick access to elements.',
        },
      ],
      type: 'p',
    };

    const result = ParagraphElementSchema.safeParse(baseTest);
    expect(result.success).toBe(true);
  });
});

describe('ListItemSchema', () => {
  test('should parse list item schema', () => {
    const baseTest: ListElement = {
      children: [
        {
          children: [
            {
              children: [
                {
                  text: 'Generate content (continue writing, summarize, explain)',
                },
              ],
              type: 'lic',
            },
          ],
          type: 'li',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'Edit existing text (improve, fix grammar, change tone)',
                },
              ],
              type: 'lic',
            },
          ],
          type: 'li',
        },
      ],
      type: 'ul',
    };

    const result = ListElementSchema.safeParse(baseTest);
    expect(result.success).toBe(true);
  });

  test('differenet list styles', () => {
    const baseTest: ReportElements = [
      {
        children: [
          {
            text: 'Decimal ',
          },
        ],
        type: 'p',
        id: '3YYOJpN8LK',
        indent: 1,
        listStyleType: 'decimal',
      },
      {
        type: 'p',
        id: '79riCzyTlg',
        indent: 1,
        listStyleType: 'decimal',
        children: [
          {
            text: 'Decimal 2',
          },
        ],
        listStart: 2,
      },
      {
        type: 'p',
        id: 'S0g6USf2H8',
        children: [
          {
            text: '',
          },
        ],
      },
      {
        type: 'p',
        id: 'u5gpIWccia',
        children: [
          {
            text: 'Lower alpha',
          },
        ],
        indent: 1,
        listStyleType: 'lower-alpha',
      },
      {
        type: 'p',
        id: 'kqAlPFNlxm',
        indent: 1,
        listStyleType: 'lower-alpha',
        children: [
          {
            text: 'Lower alpha 2',
          },
        ],
        listStart: 2,
      },
      {
        type: 'p',
        id: 'FpKTy67fSe',
        children: [
          {
            text: '',
          },
        ],
      },
      {
        type: 'p',
        id: 'Q9IhNy4v1P',
        children: [
          {
            text: 'Upper alpha',
          },
        ],
        indent: 1,
        listStyleType: 'upper-alpha',
      },
      {
        type: 'p',
        id: 'uTpmN8tuLQ',
        indent: 1,
        listStyleType: 'upper-alpha',
        children: [
          {
            text: 'Uppser alpha 2',
          },
        ],
        listStart: 2,
      },
      {
        type: 'p',
        id: 'mGtpDo24fW',
        children: [
          {
            text: '',
          },
        ],
      },
      {
        type: 'p',
        id: '2wPv-hdrig',
        children: [
          {
            text: 'Lower roman 1',
          },
        ],
        indent: 1,
        listStyleType: 'lower-roman',
      },
      {
        type: 'p',
        id: '3YdelYeIkE',
        indent: 1,
        listStyleType: 'lower-roman',
        children: [
          {
            text: 'Lower roman 2',
          },
        ],
        listStart: 2,
      },
      {
        type: 'p',
        id: 'A3THltd5v8',
        children: [
          {
            text: '',
          },
        ],
      },
      {
        type: 'p',
        id: 'jZmbpgMBG2',
        children: [
          {
            text: 'Upper Roman 1',
          },
        ],
        indent: 1,
        listStyleType: 'upper-roman',
      },
      {
        type: 'p',
        id: 'rOwdBqKgeU',
        indent: 1,
        listStyleType: 'upper-roman',
        children: [
          {
            text: 'Upper Roman 2',
          },
        ],
        listStart: 2,
      },
    ];

    const result = ReportElementsSchema.safeParse(baseTest);
    expect(result.success).toBe(true);
  });

  test('should parse list item schema with list style type', () => {
    const baseTest: ReportElements = [
      {
        children: [
          {
            text: 'asdf',
          },
        ],
        type: 'p',
        id: 'nslEPNxgnO',
        indent: 1,
        listStyleType: 'circle',
      },
      {
        type: 'p',
        id: 'sIkKvZR3i_',
        indent: 1,
        listStyleType: 'circle',
        children: [
          {
            text: 'asdf1',
          },
        ],
        listStart: 2,
      },
      {
        type: 'p',
        id: 'z3zE4tPDBp',
        children: [
          {
            text: '',
          },
        ],
      },
      {
        type: 'p',
        id: 'N4shg8ES91',
        children: [
          {
            text: 'default',
          },
        ],
        indent: 1,
        listStyleType: 'disc',
      },
      {
        type: 'p',
        id: 'Y3SPzqcF4l',
        indent: 1,
        listStyleType: 'disc',
        children: [
          {
            text: 'deaful 2',
          },
        ],
        listStart: 2,
      },
      {
        type: 'p',
        id: 'bRWXcnwOQr',
        children: [
          {
            text: '',
          },
        ],
      },
      {
        type: 'p',
        id: 'zRKomGeMrl',
        children: [
          {
            text: 'square 1',
          },
        ],
        indent: 1,
        listStyleType: 'square',
      },
      {
        type: 'p',
        id: 'LTVqwQQGDW',
        indent: 1,
        listStyleType: 'square',
        children: [
          {
            text: 'square 2',
          },
        ],
        listStart: 2,
      },
    ];

    const result = ReportElementsSchema.safeParse(baseTest);
    expect(result.success).toBe(true);
  });
});

describe('ImageSchema', () => {
  test('should parse image schema', () => {
    const baseTest: ImageElement = {
      caption: [
        {
          text: '',
        },
      ],
      children: [
        {
          text: '',
        },
      ],
      type: 'img',
      url: 'https://images.unsplash.com/photo-1712688930249-98e1963af7bd?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    };
  });
});

describe('Header Schema', () => {
  test('should parse header schema', () => {
    const baseTest: HeaderElement = {
      children: [
        {
          text: 'Table of Contents',
        },
      ],
      type: 'h3',
    };

    const result = HeaderElementSchema.safeParse(baseTest);
    expect(result.success).toBe(true);
  });
});

describe('ReportNodeSchema', () => {
  test('should parse report node', () => {
    const baseTest: ReportElements = [
      {
        children: [
          {
            text: 'Welcome to the Plate Playground!',
          },
        ],
        type: 'h1',
      },
      {
        children: [
          {
            text: 'Experience a modern rich-text editor built with ',
          },
          {
            children: [
              {
                text: 'Slate',
              },
            ],
            type: 'a',
            url: 'https://slatejs.org',
          },
          {
            text: ' and ',
          },
          {
            children: [
              {
                text: 'React',
              },
            ],
            type: 'a',
            url: 'https://reactjs.org',
          },
          {
            text: ". This playground showcases just a part of Plate's capabilities. ",
          },
          {
            children: [
              {
                text: 'Explore the documentation',
              },
            ],
            type: 'a',
            url: '/docs',
          },
          {
            text: ' to discover more.',
          },
        ],
        type: 'p',
      },
    ];

    const result = ReportElementsSchema.safeParse(baseTest);

    expect(result.success).toBe(true);
  });

  test('should parse report with header', () => {
    const baseTest: ReportElements = [
      {
        children: [
          {
            text: 'Table of Contents',
          },
        ],
        type: 'h3',
      },
    ];

    const result = ReportElementsSchema.safeParse(baseTest);

    expect(result.success).toBe(true);
  });

  test('callout test', () => {
    const baseTest: ReportElements = [
      {
        children: [
          {
            text: 'Welcome to the Plate Playground!',
          },
        ],
        type: 'h1',
      },
      {
        children: [
          {
            text: 'Experience a modern rich-text editor built with ',
          },
          {
            children: [
              {
                text: 'Slate',
              },
            ],
            type: 'a',
            url: 'https://slatejs.org',
          },
          {
            text: ' and ',
          },
          {
            children: [
              {
                text: 'React',
              },
            ],
            type: 'a',
            url: 'https://reactjs.org',
          },
          {
            text: ". This playground showcases just a part of Plate's capabilities. ",
          },
          {
            children: [
              {
                text: 'Explore the documentation',
              },
            ],
            type: 'a',
            url: '/docs',
          },
          {
            text: ' to discover more.',
          },
        ],
        type: 'p',
      },
      {
        children: [
          {
            text: 'Collaborative Editing',
          },
        ],
        type: 'h2',
      },
      {
        children: [
          {
            text: 'Review and refine content seamlessly. Use ',
          },
          {
            children: [
              {
                text: '',
              },
            ],
            type: 'a',
            url: '/docs/suggestion',
          },
          {
            text: ' or to . Discuss changes using ',
          },
          {
            children: [
              {
                text: 'comments',
              },
            ],
            type: 'a',
            url: '/docs/comment',
          },
          {
            text: ' on many text segments. You can even have  annotations!',
          },
        ],
        type: 'p',
      },
      {
        children: [
          {
            text: 'AI-Powered Editing',
          },
        ],
        type: 'h2',
      },
      {
        children: [
          {
            text: 'Boost your productivity with integrated ',
          },
          {
            children: [
              {
                text: 'AI SDK',
              },
            ],
            type: 'a',
            url: '/docs/ai',
          },
          {
            text: '. Press ',
          },
          {
            kbd: true,
            text: '⌘+J',
          },
          {
            text: ' or ',
          },
          {
            kbd: true,
            text: 'Space',
          },
          {
            text: ' in an empty line to:',
          },
        ],
        type: 'p',
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Generate content (continue writing, summarize, explain)',
                  },
                ],
                type: 'lic',
              },
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Edit existing text (improve, fix grammar, change tone)',
                  },
                ],
                type: 'lic',
              },
            ],
            type: 'li',
          },
        ],
        type: 'ul',
      },
      {
        children: [
          {
            text: 'Rich Content Editing',
          },
        ],
        type: 'h2',
      },
      {
        children: [
          {
            text: 'Structure your content with ',
          },
          {
            children: [
              {
                text: 'headings',
              },
            ],
            type: 'a',
            url: '/docs/heading',
          },
          {
            text: ', ',
          },
          {
            children: [
              {
                text: 'lists',
              },
            ],
            type: 'a',
            url: '/docs/list',
          },
          {
            text: ', and ',
          },
          {
            children: [
              {
                text: 'quotes',
              },
            ],
            type: 'a',
            url: '/docs/blockquote',
          },
          {
            text: '. Apply ',
          },
          {
            children: [
              {
                text: 'marks',
              },
            ],
            type: 'a',
            url: '/docs/basic-marks',
          },
          {
            text: ' like ',
          },
          {
            bold: true,
            text: 'bold',
          },
          {
            text: ', ',
          },
          {
            italic: true,
            text: 'italic',
          },
          {
            text: ', ',
          },
          {
            underline: true,
            text: 'underline',
          },
          {
            text: ', ',
          },
          {
            strikethrough: true,
            text: 'strikethrough',
          },
          {
            text: ', and ',
          },
          {
            code: true,
            text: 'code',
          },
          {
            text: '. Use ',
          },
          {
            children: [
              {
                text: 'autoformatting',
              },
            ],
            type: 'a',
            url: '/docs/autoformat',
          },
          {
            text: ' for ',
          },
          {
            children: [
              {
                text: 'Markdown',
              },
            ],
            type: 'a',
            url: '/docs/markdown',
          },
          {
            text: '-like shortcuts (e.g., ',
          },
          {
            kbd: true,
            text: '*',
          },
          {
            text: '  for lists, ',
          },
          {
            kbd: true,
            text: '#',
          },
          {
            text: '  for H1).',
          },
        ],
        type: 'p',
      },
      {
        children: [
          {
            text: 'Blockquotes are great for highlighting important information.',
          },
        ],
        type: 'blockquote',
      },
      {
        children: [
          {
            children: [
              {
                text: 'function hello() { ',
              },
            ],
            type: 'code_line',
          },
          {
            children: [
              {
                text: "  console.info('Code blocks are supported!');",
              },
            ],
            type: 'code_line',
          },
          {
            children: [
              {
                text: '}',
              },
            ],
            type: 'code_line',
          },
        ],
        lang: 'javascript',
        type: 'code_block',
      },
      {
        children: [
          {
            text: 'Create ',
          },
          {
            children: [
              {
                text: 'links',
              },
            ],
            type: 'a',
            url: '/docs/link',
          },
          {
            text: ', ',
          },
          {
            children: [
              {
                children: [
                  {
                    text: '',
                  },
                ],
                type: 'mention',
                value: 'mention',
              },
            ],
            type: 'a',
            url: '/docs/mention',
          },
          {
            text: ' users like ',
          },
          {
            children: [
              {
                text: '',
              },
            ],
            type: 'mention',
            value: 'Alice',
            key: 'Alice',
          },
          {
            text: ', or insert ',
          },
          {
            children: [
              {
                text: 'emojis',
              },
            ],
            type: 'a',
            url: '/docs/emoji',
          },
          {
            text: ' ✨. Use the ',
          },
          {
            children: [
              {
                text: 'slash command',
              },
            ],
            type: 'a',
            url: '/docs/slash-command',
          },
          {
            text: ' (/) for quick access to elements.',
          },
        ],
        type: 'p',
      },
      {
        children: [
          {
            text: '',
          },
        ],
        type: 'p',
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Check',
                  },
                ],
                type: 'lic',
              },
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Check 2',
                  },
                ],
                type: 'lic',
              },
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Check 3',
                  },
                ],
                type: 'lic',
              },
            ],
            type: 'li',
          },
        ],
        type: 'ul',
      },
      {
        children: [
          {
            text: '',
          },
        ],
        type: 'p',
      },
      {
        children: [
          {
            children: [
              {
                text: 'This is a good callout',
              },
            ],
            type: 'p',
          },
        ],
        type: 'callout',
      },
    ];
  });

  test('callout test 2', () => {
    const baseTest: ReportElements = [
      {
        type: 'callout',
        icon: '💡',
        children: [
          {
            children: [
              {
                text: 'This is a good callout',
              },
            ],
            type: 'p',
          },
        ],
      },
      {
        children: [
          {
            text: 'asffdddxx',
          },
        ],
        type: 'p',
      },
    ];

    const result = ReportElementsSchema.safeParse(baseTest);

    expect(result.success).toBe(true);
  });

  test('very long and deeply items', () => {
    const baseTest: ReportElements = [
      {
        children: [
          {
            text: 'Welcome to the Plate Playground!',
          },
        ],
        type: 'h1',
        id: 'hfLotm_HtY',
      },
      {
        children: [
          {
            text: 'Experience a modern rich-text editor built with ',
          },
          {
            children: [
              {
                text: 'Slate',
              },
            ],
            type: 'a',
            url: 'https://slatejs.org',
          },
          {
            text: ' and ',
          },
          {
            children: [
              {
                text: 'React',
              },
            ],
            type: 'a',
            url: 'https://reactjs.org',
          },
          {
            text: ". This playground showcases just a part of Plate's capabilities. ",
          },
          {
            children: [
              {
                text: 'Explore the documentation',
              },
            ],
            type: 'a',
            url: '/docs',
          },
          {
            text: ' to discover more.',
          },
        ],
        type: 'p',
        id: '0_XbW-qMiG',
      },
      {
        children: [
          {
            text: 'Getting Started with Numbered Lists',
          },
        ],
        type: 'h2',
        id: '5_adD-kP8v',
      },
      {
        children: [
          {
            text: 'Here are the steps to create amazing content with Plate:',
          },
        ],
        type: 'p',
        id: '7rXF1xS7ZY',
      },
      {
        children: [
          {
            text: 'Set up your Plate editor with the desired plugins',
          },
        ],
        indent: 1,
        listStyleType: 'decimal',
        type: 'p',
        id: 'uELMzpUSp7',
      },
      {
        children: [
          {
            text: 'Configure your editor theme and styling',
          },
        ],
        indent: 1,
        listStyleType: 'decimal',
        type: 'p',
        listStart: 2,
        id: 'EhyJUOQWug',
      },
      {
        children: [
          {
            text: 'Start typing and explore the rich formatting options',
          },
        ],
        indent: 1,
        listStyleType: 'decimal',
        type: 'p',
        listStart: 3,
        id: 'sN_xcqXjao',
      },
      {
        children: [
          {
            text: 'Use keyboard shortcuts for faster editing',
          },
        ],
        indent: 1,
        listStyleType: 'decimal',
        type: 'p',
        listStart: 4,
        id: 'E7knfMqjHv',
      },
      {
        children: [
          {
            text: 'Share your content with the world!',
          },
        ],
        indent: 1,
        listStyleType: 'decimal',
        type: 'p',
        listStart: 5,
        id: 'UQQqnrhwK8',
      },
      {
        children: [
          {
            text: 'You can also create nested numbered lists by increasing the indent level:',
          },
        ],
        type: 'p',
        id: 'C1gG4HZRqR',
      },
      {
        children: [
          {
            text: 'Main topic one',
          },
        ],
        indent: 1,
        listStyleType: 'decimal',
        type: 'p',
        id: 'hPRb-g2V8z',
      },
      {
        children: [
          {
            text: 'Subtopic A',
          },
        ],
        indent: 2,
        listStyleType: 'decimal',
        type: 'p',
        id: 'k-d2Jz-zR0',
      },
      {
        children: [
          {
            text: 'Subtopic B',
          },
        ],
        indent: 2,
        listStyleType: 'decimal',
        type: 'p',
        listStart: 2,
        id: '92P-A4yZKi',
      },
      {
        children: [
          {
            text: 'Main topic two',
          },
        ],
        indent: 1,
        listStyleType: 'decimal',
        type: 'p',
        listStart: 2,
        id: 'EW1i7WBLPL',
      },
      {
        children: [
          {
            text: 'Another subtopic',
          },
        ],
        indent: 2,
        listStyleType: 'decimal',
        type: 'p',
        id: 'YHoqixEgMN',
      },
      {
        indent: 3,
        listStyleType: 'decimal',
        type: 'p',
        id: 'Ad7HovjOKy',
        children: [
          {
            text: 'This another list element',
          },
        ],
      },
      {
        indent: 4,
        listStyleType: 'decimal',
        type: 'p',
        id: 'oy5lozV8JC',
        children: [
          {
            text: 'Yet another list element',
          },
        ],
      },
      {
        indent: 5,
        listStyleType: 'decimal',
        type: 'p',
        id: 'At8wrPNrfD',
        children: [
          {
            text: 'WOW! REALLY DEEp',
          },
        ],
      },
      {
        indent: 5,
        listStyleType: 'decimal',
        type: 'p',
        id: 'r6xOzeMPMk',
        children: [
          {
            text: 'SUPER DEEP',
          },
        ],
        listStart: 2,
      },
      {
        type: 'p',
        id: 'OrJUi4LZkd',
        children: [
          {
            text: '',
          },
        ],
      },
      {
        children: [
          {
            text: 'I can put stuff in here?',
          },
        ],
        type: 'toggle',
        id: '747EceESeA',
      },
      {
        type: 'p',
        id: 'nBM2gucWNw',
        children: [
          {
            text: 'What can I put in ',
            bold: true,
          },
          {
            bold: true,
            text: 'here ',
            italic: true,
            underline: true,
            strikethrough: true,
          },
          {
            text: 'asdf',
            code: true,
          },
        ],
        indent: 1,
      },
      {
        children: [
          {
            text: 'AI-Powered Editing',
          },
        ],
        type: 'h2',
        id: 'yrUAnhl_lZ',
      },
      {
        children: [
          {
            text: 'Boost your productivity with integrated ',
          },
          {
            children: [
              {
                text: 'AI SDK',
              },
            ],
            type: 'a',
            url: '/docs/ai',
          },
          {
            text: '. Press ',
          },
          {
            kbd: true,
            text: '⌘+J',
          },
          {
            text: ' or ',
          },
          {
            kbd: true,
            text: 'Space',
          },
          {
            text: ' in an empty line to:',
          },
        ],
        type: 'p',
        id: 'WKiKh-o_qv',
      },
      {
        children: [
          {
            text: 'Generate content (continue writing, summarize, explain)',
          },
        ],
        indent: 1,
        listStyleType: 'disc',
        type: 'p',
        id: 'Hcnj_n0Ssu',
      },
      {
        children: [
          {
            text: 'Edit existing text (improve, fix grammar, change tone)',
          },
        ],
        indent: 1,
        listStyleType: 'disc',
        type: 'p',
        listStart: 2,
        id: 'DAjVqFHm20',
      },
      {
        children: [
          {
            text: 'Rich Content Editing',
          },
        ],
        type: 'h2',
        id: 'IfCnjYekX5',
      },
      {
        children: [
          {
            text: 'Structure your content with ',
          },
          {
            children: [
              {
                text: 'headings',
              },
            ],
            type: 'a',
            url: '/docs/heading',
          },
          {
            text: ', ',
          },
          {
            children: [
              {
                text: 'lists',
              },
            ],
            type: 'a',
            url: '/docs/list',
          },
          {
            text: ', and ',
          },
          {
            children: [
              {
                text: 'quotes',
              },
            ],
            type: 'a',
            url: '/docs/blockquote',
          },
          {
            text: '. Apply ',
          },
          {
            children: [
              {
                text: 'marks',
              },
            ],
            type: 'a',
            url: '/docs/basic-marks',
          },
          {
            text: ' like ',
          },
          {
            bold: true,
            text: 'bold',
          },
          {
            text: ', ',
          },
          {
            italic: true,
            text: 'italic',
          },
          {
            text: ', ',
          },
          {
            text: 'underline',
            underline: true,
          },
          {
            text: ', ',
          },
          {
            strikethrough: true,
            text: 'strikethrough',
          },
          {
            text: ', and ',
          },
          {
            code: true,
            text: 'code',
          },
          {
            text: '. Use ',
          },
          {
            children: [
              {
                text: 'autoformatting',
              },
            ],
            type: 'a',
            url: '/docs/autoformat',
          },
          {
            text: ' for ',
          },
          {
            children: [
              {
                text: 'Markdown',
              },
            ],
            type: 'a',
            url: '/docs/markdown',
          },
          {
            text: '-like shortcuts (e.g., ',
          },
          {
            kbd: true,
            text: '* ',
          },
          {
            text: ' for lists, ',
          },
          {
            kbd: true,
            text: '# ',
          },
          {
            text: ' for H1).',
          },
        ],
        type: 'p',
        id: '6gZ7csXovm',
      },
      {
        children: [
          {
            children: [
              {
                text: 'Blockquotes are great for highlighting important information.',
              },
            ],
            type: 'p',
            id: '8I3vZXIKxh',
          },
        ],
        type: 'blockquote',
        id: 'NAoNBDqYic',
      },
      {
        children: [
          {
            children: [
              {
                text: 'function hello() {',
              },
            ],
            type: 'code_line',
            id: 'RPj3PMNhex',
          },
          {
            children: [
              {
                text: "  console.info('Code blocks are supported!');",
              },
            ],
            type: 'code_line',
            id: '1Lb2L3IQZp',
          },
          {
            children: [
              {
                text: '}',
              },
            ],
            type: 'code_line',
            id: 'Yc6fYsoVMA',
          },
        ],
        lang: 'javascript',
        type: 'code_block',
        id: 'j6CV133AKK',
      },
      {
        children: [
          {
            text: 'Create ',
          },
          {
            children: [
              {
                text: 'links',
              },
            ],
            type: 'a',
            url: '/docs/link',
          },
          {
            text: ', ',
          },
          {
            children: [
              {
                text: '@mention',
              },
            ],
            type: 'a',
            url: '/docs/mention',
          },
          {
            text: ' users like ',
          },
          {
            children: [
              {
                text: '',
              },
            ],
            type: 'mention',
            value: 'Alice',
          },
          {
            text: ', or insert ',
          },
          {
            children: [
              {
                text: 'emojis',
              },
            ],
            type: 'a',
            url: '/docs/emoji',
          },
          {
            text: ' ✨. Use the ',
          },
          {
            children: [
              {
                text: 'slash command',
              },
            ],
            type: 'a',
            url: '/docs/slash-command',
          },
          {
            text: ' (/) for quick access to elements.',
          },
        ],
        type: 'p',
        id: 'D8r_bd8AVR',
      },
      {
        children: [
          {
            text: 'How Plate Compares',
          },
        ],
        type: 'h3',
        id: 'yT8pTxpRXT',
      },
      {
        children: [
          {
            text: 'Plate offers many features out-of-the-box as free, open-source plugins.',
          },
        ],
        type: 'p',
        id: 'oxytVl2CL3',
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    children: [
                      {
                        bold: true,
                        text: 'Feature',
                      },
                    ],
                    type: 'p',
                    id: 'wkY6guye5q',
                  },
                ],
                type: 'th',
                id: 'G0q8mo4VfI',
              },
              {
                children: [
                  {
                    children: [
                      {
                        bold: true,
                        text: 'Plate (Free & OSS)',
                      },
                    ],
                    type: 'p',
                    id: 'YhgGl8SjGC',
                  },
                ],
                type: 'th',
                id: 'tIK7ihXpdW',
              },
              {
                children: [
                  {
                    children: [
                      {
                        bold: true,
                        text: 'Tiptap',
                      },
                    ],
                    type: 'p',
                    id: 'aXKcPB1r_j',
                  },
                ],
                type: 'th',
                id: 'wyRMSzzU3u',
              },
            ],
            type: 'tr',
            id: 'saen2DDEYc',
          },
          {
            children: [
              {
                children: [
                  {
                    children: [
                      {
                        text: 'AI',
                      },
                    ],
                    type: 'p',
                    id: 'vfvQDx_HH5',
                  },
                ],
                type: 'td',
                id: 'cjNs4HQo3I',
              },
              {
                children: [
                  {
                    attributes: {
                      align: 'center',
                    },
                    children: [
                      {
                        text: '✅',
                      },
                    ],
                    type: 'p',
                    id: 'MYgVH2ROjB',
                  },
                ],
                type: 'td',
                id: 'cSy9IcxXqj',
              },
              {
                children: [
                  {
                    children: [
                      {
                        text: 'Paid Extension',
                      },
                    ],
                    type: 'p',
                    id: 'CgkfXdvgec',
                  },
                ],
                type: 'td',
                id: 'hfSJBMPr8l',
              },
            ],
            type: 'tr',
            id: 'tncX2kkepO',
          },
          {
            children: [
              {
                children: [
                  {
                    children: [
                      {
                        text: 'Comments',
                      },
                    ],
                    type: 'p',
                    id: 'wCQ5vKTiZM',
                  },
                ],
                type: 'td',
                id: 'DInJXlEmE0',
              },
              {
                children: [
                  {
                    attributes: {
                      align: 'center',
                    },
                    children: [
                      {
                        text: '✅',
                      },
                    ],
                    type: 'p',
                    id: '9CxA5yhNqf',
                  },
                ],
                type: 'td',
                id: '-d3FW_9eSs',
              },
              {
                children: [
                  {
                    children: [
                      {
                        text: 'Paid Extension',
                      },
                    ],
                    type: 'p',
                    id: '1QsT5qVZjl',
                  },
                ],
                type: 'td',
                id: 'iYrpuXiyJ4',
              },
            ],
            type: 'tr',
            id: '_nCs8AFV8Y',
          },
          {
            children: [
              {
                children: [
                  {
                    children: [
                      {
                        text: 'Suggestions',
                      },
                    ],
                    type: 'p',
                    id: '-PQgowYPMI',
                  },
                ],
                type: 'td',
                id: 'BHxk2Zdlnf',
              },
              {
                children: [
                  {
                    attributes: {
                      align: 'center',
                    },
                    children: [
                      {
                        text: '✅',
                      },
                    ],
                    type: 'p',
                    id: 'VmdDFdlVps',
                  },
                ],
                type: 'td',
                id: 'iAFfMtr9bf',
              },
              {
                children: [
                  {
                    children: [
                      {
                        text: 'Paid (Comments Pro)',
                      },
                    ],
                    type: 'p',
                    id: 'GW55vdFLFC',
                  },
                ],
                type: 'td',
                id: '9wIr0uom45',
              },
            ],
            type: 'tr',
            id: 'mqJeHPVcrC',
          },
          {
            children: [
              {
                children: [
                  {
                    children: [
                      {
                        text: 'Emoji Picker',
                      },
                    ],
                    type: 'p',
                    id: 'LiE8JaIlTC',
                  },
                ],
                type: 'td',
                id: '9pFAhLxPvn',
              },
              {
                children: [
                  {
                    attributes: {
                      align: 'center',
                    },
                    children: [
                      {
                        text: '✅',
                      },
                    ],
                    type: 'p',
                    id: 'NJSnhoPzLY',
                  },
                ],
                type: 'td',
                id: 'wp8x_kzX5a',
              },
              {
                children: [
                  {
                    children: [
                      {
                        text: 'Paid Extension',
                      },
                    ],
                    type: 'p',
                    id: 'jm6eiX_Bn3',
                  },
                ],
                type: 'td',
                id: 't8hfRp37oJ',
              },
            ],
            type: 'tr',
            id: 'iufBp--07s',
          },
          {
            children: [
              {
                children: [
                  {
                    children: [
                      {
                        text: 'Table of Contents',
                      },
                    ],
                    type: 'p',
                    id: '076IExDDU7',
                  },
                ],
                type: 'td',
                id: 'dpziwXBENA',
              },
              {
                children: [
                  {
                    attributes: {
                      align: 'center',
                    },
                    children: [
                      {
                        text: '✅',
                      },
                    ],
                    type: 'p',
                    id: '23FhKT87vy',
                  },
                ],
                type: 'td',
                id: 'vmrtyx60Vv',
              },
              {
                children: [
                  {
                    children: [
                      {
                        text: 'Paid Extension',
                      },
                    ],
                    type: 'p',
                    id: 'aXWmVD9XKG',
                  },
                ],
                type: 'td',
                id: 'bbJV22Dd4m',
              },
            ],
            type: 'tr',
            id: 'UdfoZ4ML4w',
          },
          {
            children: [
              {
                children: [
                  {
                    children: [
                      {
                        text: 'Drag Handle',
                      },
                    ],
                    type: 'p',
                    id: 'j_p2fV-rEl',
                  },
                ],
                type: 'td',
                id: 'r4yu0IauT8',
              },
              {
                children: [
                  {
                    attributes: {
                      align: 'center',
                    },
                    children: [
                      {
                        text: '✅',
                      },
                    ],
                    type: 'p',
                    id: 'gClNhB6qlt',
                  },
                ],
                type: 'td',
                id: '3f9n1TyGTE',
              },
              {
                children: [
                  {
                    children: [
                      {
                        text: 'Paid Extension',
                      },
                    ],
                    type: 'p',
                    id: 'AHxK6R7gkP',
                  },
                ],
                type: 'td',
                id: 'uee-J3kAiK',
              },
            ],
            type: 'tr',
            id: 'Wqr-kaAlXe',
          },
          {
            children: [
              {
                children: [
                  {
                    children: [
                      {
                        text: 'Collaboration (Yjs)',
                      },
                    ],
                    type: 'p',
                    id: 'BczpVUKNcv',
                  },
                ],
                type: 'td',
                id: 'WHr6MLnERh',
              },
              {
                children: [
                  {
                    attributes: {
                      align: 'center',
                    },
                    children: [
                      {
                        text: '✅',
                      },
                    ],
                    type: 'p',
                    id: 'nxYT-YHvDk',
                  },
                ],
                type: 'td',
                id: 'YoynbS3Qdc',
              },
              {
                children: [
                  {
                    children: [
                      {
                        text: 'Hocuspocus (OSS/Paid)',
                      },
                    ],
                    type: 'p',
                    id: 'QFLyE2ocqv',
                  },
                ],
                type: 'td',
                id: 'dHc7UZAatJ',
              },
            ],
            type: 'tr',
            id: 'k0sAORJasL',
          },
        ],
        type: 'table',
        id: 'mYz9LAB3W1',
      },
      {
        children: [
          {
            text: 'Column Layouts',
          },
        ],
        type: 'h3',
        id: 'cirlSaY3BB',
      },
      {
        children: [
          {
            text: 'Organize content using flexible column layouts. The three-column layout below demonstrates equal-width columns:',
          },
        ],
        type: 'p',
        id: 'Uu0qn2gUo5',
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Column 1',
                  },
                ],
                type: 'h4',
                id: '3OkoOkpJAW',
              },
              {
                children: [
                  {
                    text: 'This is the first column with some sample content. You can add any type of content here including text, images, lists, and more.',
                  },
                ],
                type: 'p',
                id: '779v_z28_d',
              },
              {
                children: [
                  {
                    text: 'First item',
                  },
                ],
                indent: 1,
                listStyleType: 'disc',
                type: 'p',
                id: '3-y_Fv9PaP',
              },
              {
                children: [
                  {
                    text: 'Second item',
                  },
                ],
                indent: 1,
                listStyleType: 'disc',
                type: 'p',
                listStart: 2,
                id: 'hMb6b4AutW',
              },
            ],
            type: 'column',
            width: '33.333333333333336%',
            id: 'VwRTrF7xJj',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Column 2',
                  },
                ],
                type: 'h4',
                id: 'sm8iy4HzKA',
              },
              {
                children: [
                  {
                    text: 'The middle column showcases different content types. Here you can see how ',
                  },
                  {
                    bold: true,
                    text: 'bold text',
                  },
                  {
                    text: ' and ',
                  },
                  {
                    italic: true,
                    text: 'italic text',
                  },
                  {
                    text: ' work within columns.',
                  },
                ],
                type: 'p',
                id: 'SSkiBneCC3',
              },
              {
                children: [
                  {
                    children: [
                      {
                        text: 'Important note: columns are fully responsive and work great on all devices.',
                      },
                    ],
                    type: 'p',
                    id: 'FqqMM2QOt3',
                  },
                ],
                type: 'blockquote',
                id: 'JBz2uEhrII',
              },
            ],
            type: 'column',
            width: '33.333333333333336%',
            id: 'VFNNeWKLJh',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Column 3',
                  },
                ],
                type: 'h4',
                id: '5ofpva3toC',
              },
              {
                children: [
                  {
                    text: 'The third column demonstrates links and other elements. Visit ',
                  },
                  {
                    children: [
                      {
                        text: 'Plate documentation',
                      },
                    ],
                    type: 'a',
                    url: '/docs',
                  },
                  {
                    text: ' for more information about column layouts.',
                  },
                ],
                type: 'p',
                id: '4xv9gAx2GC',
              },
              {
                children: [
                  {
                    text: 'You can also add code: ',
                  },
                ],
                type: 'p',
                id: '0w_Rt8QC-2',
              },
              {
                children: [
                  {
                    code: true,
                    text: 'console.log("Hello from column 3!");',
                  },
                ],
                type: 'p',
                id: 'W8JbrgIcv5',
              },
            ],
            type: 'column',
            width: '33.333333333333336%',
            id: 'e8xNsG9rz1',
          },
        ],
        type: 'column_group',
        id: 'R3p1a5Cq_F',
      },
      {
        children: [
          {
            text: "Here's a two-column layout with different proportions:",
          },
        ],
        type: 'p',
        id: 'pOA_Xd84d_',
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Main Content (70%)',
                  },
                ],
                type: 'h4',
                id: '4jdSynfol5',
              },
              {
                children: [
                  {
                    text: 'This wider column contains the main content. It takes up 70% of the available width, making it perfect for primary content like articles, detailed descriptions, or main features.',
                  },
                ],
                type: 'p',
                id: 'kEG_LJ6sKv',
              },
              {
                children: [
                  {
                    text: 'You can include complex content structures:',
                  },
                ],
                type: 'p',
                id: 'ed18hM8DgE',
              },
              {
                children: [
                  {
                    children: [
                      {
                        text: 'const createLayout = () => {',
                      },
                    ],
                    type: 'code_line',
                    id: 'Xquh4TOh7w',
                  },
                  {
                    children: [
                      {
                        text: '  return {',
                      },
                    ],
                    type: 'code_line',
                    id: 'IX-1BZKdWE',
                  },
                  {
                    children: [
                      {
                        text: '    columns: 2,',
                      },
                    ],
                    type: 'code_line',
                    id: 'UxWaC6dvwd',
                  },
                  {
                    children: [
                      {
                        text: '    widths: ["70%", "30%"]',
                      },
                    ],
                    type: 'code_line',
                    id: 'ZXC-ySOcTK',
                  },
                  {
                    children: [
                      {
                        text: '  };',
                      },
                    ],
                    type: 'code_line',
                    id: '3N6W9FrT-I',
                  },
                  {
                    children: [
                      {
                        text: '};',
                      },
                    ],
                    type: 'code_line',
                    id: 'hGqcSYv_Oy',
                  },
                ],
                lang: 'javascript',
                type: 'code_block',
                id: 'hmeVjH0aqK',
              },
            ],
            type: 'column',
            width: '70%',
            id: 'QLPDFAuJ_J',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Sidebar (30%)',
                  },
                ],
                type: 'h4',
                id: 'SCdbHBGdMY',
              },
              {
                children: [
                  {
                    text: 'This narrower column works well for:',
                  },
                ],
                type: 'p',
                id: 'QrZQglHbsv',
              },
              {
                children: [
                  {
                    text: 'Sidebars',
                  },
                ],
                indent: 1,
                listStyleType: 'disc',
                type: 'p',
                id: 'FlWVHvB37w',
              },
              {
                children: [
                  {
                    text: 'Navigation menus',
                  },
                ],
                indent: 1,
                listStyleType: 'disc',
                type: 'p',
                listStart: 2,
                id: 'Y4VDYzIhXg',
              },
              {
                children: [
                  {
                    text: 'Call-to-action buttons',
                  },
                ],
                indent: 1,
                listStyleType: 'disc',
                type: 'p',
                listStart: 3,
                id: 'C8j5v1QKM_',
              },
              {
                children: [
                  {
                    text: 'Quick facts',
                  },
                ],
                indent: 1,
                listStyleType: 'disc',
                type: 'p',
                listStart: 4,
                id: '8KiKRCpvMg',
              },
              {
                children: [
                  {
                    text: 'The smaller width makes it perfect for supplementary information.',
                  },
                ],
                type: 'p',
                id: 'PIdL2c5d1m',
              },
            ],
            type: 'column',
            width: '30%',
            id: 'rT5swsfoIe',
          },
        ],
        type: 'column_group',
        id: 'aOGqPf1W_W',
      },
      {
        children: [
          {
            text: 'Images and Media',
          },
        ],
        type: 'h3',
        id: 'H7D2w3bDbj',
      },
      {
        children: [
          {
            text: 'Embed rich media like images directly in your content. Supports ',
          },
          {
            children: [
              {
                text: 'Media uploads',
              },
            ],
            type: 'a',
            url: '/docs/media',
          },
          {
            text: ' and ',
          },
          {
            children: [
              {
                text: 'drag & drop',
              },
            ],
            type: 'a',
            url: '/docs/dnd',
          },
          {
            text: ' for a smooth experience.',
          },
        ],
        type: 'p',
        id: 'Gws8HwXKCN',
      },
      {
        attributes: {
          align: 'center',
        },
        caption: [
          {
            children: [
              {
                text: 'Images with captions provide context.',
              },
            ],
            type: 'p',
          },
        ],
        children: [
          {
            text: '',
          },
        ],
        type: 'img',
        url: 'https://images.unsplash.com/photo-1712688930249-98e1963af7bd?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        width: '75%',
        id: 'TAgIq20AcZ',
      },
      {
        children: [
          {
            text: '',
          },
        ],
        isUpload: true,
        name: 'sample.pdf',
        type: 'file',
        url: 'https://s26.q4cdn.com/900411403/files/doc_downloads/test.pdf',
        id: 'geOPl0Cxfp',
      },
      {
        children: [
          {
            text: '',
          },
        ],
        type: 'audio',
        url: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3',
        id: 'MEd7vvKBhp',
      },
      {
        children: [
          {
            text: 'Table of Contents',
          },
        ],
        type: 'h3',
        id: 'KShnfIa4eK',
      },
      {
        children: [
          {
            text: '',
          },
        ],
        type: 'toc',
        id: '92caiwSMPu',
      },
      {
        children: [
          {
            text: '',
          },
        ],
        type: 'p',
        id: 'Bm7Dh-VF9_',
      },
    ];

    const result = ReportElementsSchema.safeParse(baseTest);

    expect(result.success).toBe(true);
  });
});
