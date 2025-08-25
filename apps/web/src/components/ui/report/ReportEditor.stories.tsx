import type { ReportElementWithId } from '@buster/server-shared/reports';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { ReportEditor } from './ReportEditor';
import { useEffect, useRef, useState } from 'react';
import { useMount } from '@/hooks';
import { cn } from '@/lib/classMerge';
import type { Value } from 'platejs';

const meta = {
  title: 'UI/report/ReportEditor',
  component: ReportEditor,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [
        // Mock Supabase auth endpoints to prevent MSW warnings
        // http.post('http://127.0.0.1:54321/auth/v1/token', ({ request }) => {
        //   return HttpResponse.json({
        //     access_token: 'mock_access_token',
        //     token_type: 'bearer',
        //     expires_in: 3600,
        //     refresh_token: 'mock_refresh_token',
        //     user: {
        //       id: 'mock_user_id',
        //       email: 'mock@example.com',
        //       is_anonymous: false
        //     }
        //   });
        // }),
        // http.post('http://127.0.0.1:54321/auth/v1/refresh', ({ request }) => {
        //   return HttpResponse.json({
        //     access_token: 'mock_refreshed_access_token',
        //     token_type: 'bearer',
        //     expires_in: 3600,
        //     refresh_token: 'mock_new_refresh_token',
        //     user: {
        //       id: 'mock_user_id',
        //       email: 'mock@example.com',
        //       is_anonymous: false
        //     }
        //   });
        // }),
        // http.post('http://127.0.0.1:3001/api/v1/search', ({ request }) => {
        //   return HttpResponse.json([]);
        // })
      ]
    }
  },
  decorators: [
    (Story) => (
      <div className="border">
        <Story />
      </div>
    )
  ],
  args: {
    placeholder: 'Start typing...',
    readOnly: false,
    variant: 'default'
  }
} satisfies Meta<typeof ReportEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// Create a strictly typed value first, then assert it as Value for platejs
const sampleValue = [
  {
    type: 'h1', // This will now error if you use 'h1xs'
    children: [{ text: 'Welcome to the Report Editor' }]
  },
  {
    type: 'p',
    children: [
      { text: 'This is a sample paragraph with ' },
      { text: 'bold text', bold: true },
      { text: ' and ' },
      { text: 'italic text', italic: true },
      { text: '.' },
      { text: 'hilight', highlight: true }
    ]
  },
  {
    type: 'h2',
    children: [{ text: 'Features' }]
  },
  {
    type: 'img',
    children: [{ text: '' }],
    width: 200,
    url: 'https://picsum.photos/200/200',
    caption: [{ text: 'This is a caption' }]
  },
  {
    type: 'callout',
    variant: 'info',
    children: [{ text: 'This is an info callout with custom styling!' }]
  },
  {
    type: 'h3', // This is now valid - TypeScript knows this is a valid HeadingType
    children: [{ text: 'Title' }]
  },
  // Uncommenting this would cause a TypeScript error:
  // {
  //   type: 'xxxh3', // Error: Type '"xxxh3"' is not assignable to type ReportElementType
  //   children: [{ text: 'Invalid' }]
  // },
  {
    type: 'blockquote',
    children: [
      { text: 'This is a blockquote. It can contain styled text and other inline elements.' }
    ]
  },
  {
    type: 'code_block',
    lang: 'javascript',
    children: [
      {
        type: 'code_line',
        children: [{ text: 'const greeting = "Hello, World!";' }]
      },
      {
        type: 'code_line',
        children: [{ text: 'console.log(greeting);' }]
      },
      {
        type: 'code_line',
        children: [{ text: '}' }]
      }
    ]
  },
  {
    children: [
      { children: [{ text: 'function hello() {' }], type: 'code_line' },
      {
        children: [{ text: "  console.info('Code blocks are supported!');" }],
        type: 'code_line'
      },
      { children: [{ text: '}' }], type: 'code_line' }
    ],
    lang: 'javascript',
    type: 'code_block'
  },

  {
    type: 'h1',
    children: [{ text: 'Hello' }]
  },
  // Table Section
  {
    children: [{ text: 'How Plate Compares' }],
    type: 'h3'
  },
  {
    children: [
      {
        text: 'Plate offers many features out-of-the-box as free, open-source plugins.'
      }
    ],
    type: 'p'
  },
  {
    type: 'table',
    children: [
      {
        children: [
          {
            children: [{ bold: true, text: 'Feature' }],
            type: 'th'
          },
          {
            children: [
              {
                children: [{ bold: true, text: 'Plate (Free & OSS)' }],
                type: 'p'
              }
            ],
            type: 'th'
          },
          {
            children: [{ children: [{ bold: true, text: 'Tiptap' }], type: 'p' }],
            type: 'th'
          }
        ],
        type: 'tr'
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'AI' }], type: 'p' }],
            type: 'td'
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p'
              }
            ],
            type: 'td'
          },
          {
            children: [{ children: [{ text: 'Paid Extension' }], type: 'p' }],
            type: 'td'
          }
        ],
        type: 'tr'
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Comments' }], type: 'p' }],
            type: 'td'
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p'
              }
            ],
            type: 'td'
          },
          {
            children: [{ children: [{ text: 'Paid Extension' }], type: 'p' }],
            type: 'td'
          }
        ],
        type: 'tr'
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Suggestions' }], type: 'p' }],
            type: 'td'
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p'
              }
            ],
            type: 'td'
          },
          {
            children: [{ children: [{ text: 'Paid (Comments Pro)' }], type: 'p' }],
            type: 'td'
          }
        ],
        type: 'tr'
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Emoji Picker' }], type: 'p' }],
            type: 'td'
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p'
              }
            ],
            type: 'td'
          },
          {
            children: [{ children: [{ text: 'Paid Extension' }], type: 'p' }],
            type: 'td'
          }
        ],
        type: 'tr'
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Table of Contents' }], type: 'p' }],
            type: 'td'
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p'
              }
            ],
            type: 'td'
          },
          {
            children: [{ children: [{ text: 'Paid Extension' }], type: 'p' }],
            type: 'td'
          }
        ],
        type: 'tr'
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Drag Handle' }], type: 'p' }],
            type: 'td'
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p'
              }
            ],
            type: 'td'
          },
          {
            children: [{ children: [{ text: 'Paid Extension' }], type: 'p' }],
            type: 'td'
          }
        ],
        type: 'tr'
      },
      {
        children: [
          {
            children: [{ children: [{ text: 'Collaboration (Yjs)' }], type: 'p' }],
            type: 'td'
          },
          {
            children: [
              {
                attributes: { align: 'center' },
                children: [{ text: '✅' }],
                type: 'p'
              }
            ],
            type: 'td'
          },
          {
            children: [{ children: [{ text: 'Hocuspocus (OSS/Paid)' }], type: 'p' }],
            type: 'td'
          }
        ],
        type: 'tr'
      }
    ]
  }
].map((element, index) => ({
  ...element,
  id: `id-${index}`
})) as Value;

// Cast to Value for platejs compatibility
const plateValue = sampleValue;

export const Default: Story = {
  args: {
    initialElements: plateValue
  }
};

export const ReadOnly: Story = {
  args: {
    initialElements: plateValue,
    readOnly: true
  }
};

export const WithCustomKit: Story = {
  args: {
    initialElements: [
      {
        type: 'h1',
        children: [{ text: 'Hello' }]
      },
      {
        type: 'metric',
        children: [{ text: '' }],
        metricId: ''
      },
      {
        type: 'characterCounter' as 'p',
        children: [{ text: 'This is my character counter' }]
      },
      {
        type: 'p',
        children: [{ text: 'paragraph test' }]
      },
      {
        type: 'metric',
        children: [{ text: '' }],
        metricId: '1234',
        caption: [{ text: 'This is a caption' }]
      },
      {
        type: 'img',
        children: [{ text: '' }],
        url: 'https://picsum.photos/200/200',
        caption: [{ text: 'This is a caption' }]
      }
    ].map((element, index) => ({
      ...element,
      id: `id-${index}`
    })) as ReportElementWithId[],
    useFixedToolbarKit: true
  }
};
