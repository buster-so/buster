'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { InputTextArea } from '@/components/ui/inputs/InputTextArea';
import type { ReportElements } from '@buster/server-shared/reports';
import { useQuery } from '@tanstack/react-query';
import { mainApiV2 } from '@/api/buster_rest/instances';
import { useDebounceEffect } from '@/hooks';
import { useThemesConfig } from '@/components/ui/report/ThemeWrapper/useThemesConfig';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

import DynamicReportEditor from '@/components/ui/report/DynamticEditor';

// Status indicator component with dynamic backgrounds

export const ReportPlayground: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>('');
  const [hasBeenSuccessFullAtLeastOnce, setHasBeenSuccessFullAtLeastOnce] = useState(false);

  const { data, refetch, isLoading, isFetched, error } = useQuery({
    queryKey: ['report-playground', markdown],
    queryFn: () => {
      return mainApiV2
        .post<{ elements: ReportElements }>('/temp/validate-markdown', { markdown })
        .then((res) => {
          setHasBeenSuccessFullAtLeastOnce(true);
          return res.data;
        });
    },
    enabled: false
  });

  useDebounceEffect(
    () => {
      if (markdown.length > 0) {
        refetch();
      }
    },
    [markdown, refetch],
    { wait: 150 }
  );

  const usedValue: ReportElements = hasBeenSuccessFullAtLeastOnce ? data?.elements || [] : value;

  return (
    <div className="grid max-h-screen min-h-screen grid-cols-[270px_1fr] gap-5 rounded border p-7">
      <div className="flex h-full flex-col space-y-5">
        <InputTextArea
          className="flex-1 resize-none"
          placeholder="Put markdown here"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
        />
        <ValidationStatus isLoading={isLoading} error={error} isFetched={isFetched} data={data} />
        {data && (
          <div className="max-h-[28vh] min-h-0 flex-1">
            <div className="flex h-full flex-col">
              <h3 className="mb-2 text-sm font-medium text-gray-700">Successful Response:</h3>
              <pre className="flex-1 overflow-auto rounded border bg-gray-50 p-3 font-mono text-xs">
                {JSON.stringify(data.elements, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <ThemePicker />
      </div>
      <div className="bg-background h-full max-h-[calc(100vh-56px)] overflow-y-auto rounded border shadow">
        <DynamicReportEditor value={usedValue} readOnly={false} />
      </div>
    </div>
  );
};

interface ValidationStatusProps {
  isLoading: boolean;
  error: unknown;
  isFetched: boolean;
  data: { elements: ReportElements } | undefined;
}

const ValidationStatus: React.FC<ValidationStatusProps> = ({
  isLoading,
  error,
  isFetched,
  data
}) => {
  // Determine status and styling
  const getStatusConfig = () => {
    if (isLoading) {
      return {
        bgClass: 'bg-blue-50 border-blue-200',
        textClass: 'text-blue-700',
        iconBg: 'bg-blue-600',
        icon: (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        ),
        message: 'Validating markdown...'
      };
    }

    if (error && !isLoading) {
      return {
        bgClass: 'bg-red-50 border-red-200',
        textClass: 'text-red-700',
        iconBg: 'bg-red-600',
        icon: (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-600">
            <span className="text-xs text-white">✕</span>
          </div>
        ),
        message: `Validation failed: ${error instanceof Error ? error.message : error || 'Unknown error'}`
      };
    }

    if (isFetched && !error && !isLoading && data) {
      return {
        bgClass: 'bg-green-50 border-green-400',
        textClass: 'text-green-700',
        iconBg: 'bg-green-600',
        icon: (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-600">
            <span className="text-xs text-white">✓</span>
          </div>
        ),
        message: 'Markdown validated successfully'
      };
    }

    // Default/ready state
    return {
      bgClass: 'bg-gray-50 border-gray-200',
      textClass: 'text-gray-600',
      iconBg: 'bg-gray-400',
      icon: <div className="h-4 w-4 rounded-full bg-gray-400"></div>,
      message: 'Ready to validate'
    };
  };

  const config = getStatusConfig();

  return (
    <div
      className={`flex min-h-8 items-center justify-center rounded border p-4 transition-colors duration-200 ${config.bgClass}`}>
      <div className={`flex items-center space-x-2 ${config.textClass}`}>
        {config.icon}
        <span className="text-sm font-medium">{config.message}</span>
      </div>
    </div>
  );
};

const ThemePicker = React.memo(() => {
  const { activeTheme, setActiveTheme, allThemes } = useThemesConfig();

  const themesList = Object.values(allThemes);

  return (
    <div className="bg-background flex gap-x-2 overflow-x-auto rounded border p-2">
      {themesList.map((theme) => {
        const firstThreeColors = Object.values(theme.light).slice(0, 3);

        const isActive = activeTheme.id === theme.id;
        return (
          <Tooltip key={theme.id} title={theme.id}>
            <div
              className={cn(
                'min-h-7 min-w-7 cursor-pointer rounded-full border transition-all duration-200 hover:scale-110',
                isActive && 'border-primary shadow-2xl'
              )}
              style={{
                background: `linear-gradient(0deg, hsl(${firstThreeColors[0]}) 0%, hsl(${firstThreeColors[0]}) 33%, hsl(${firstThreeColors[1]}) 33%, hsl(${firstThreeColors[1]}) 66%, hsl(${firstThreeColors[2]}) 66%, hsl(${firstThreeColors[2]}) 100%)`
              }}
              onClick={() => setActiveTheme(theme)}
              title={theme.id}
            />
          </Tooltip>
        );
      })}
    </div>
  );
});

ThemePicker.displayName = 'ThemePicker';

const value: ReportElements = [
  {
    children: [{ text: 'Welcome to the Plate Playground!' }],
    type: 'h1'
  },
  {
    children: [
      { text: 'Experience a modern rich-text editor built with ' },
      { children: [{ text: 'Slate' }], type: 'a', url: 'https://slatejs.org' },
      { text: ' and ' },
      { children: [{ text: 'React' }], type: 'a', url: 'https://reactjs.org' },
      {
        text: ". This playground showcases just a part of Plate's capabilities. "
      },
      {
        children: [{ text: 'Explore the documentation' }],
        type: 'a',
        url: '/docs'
      },
      { text: ' to discover more.' }
    ],
    type: 'p'
  },

  // {
  //   children: [
  //     {
  //       text: 'Block-level suggestions are also supported for broader feedback.',
  //     },
  //   ],
  //   suggestion: {
  //     suggestionId: 'suggestionBlock1',
  //     type: 'block',
  //     userId: 'charlie',
  //   },
  //   type: 'p',
  // },
  // AI Section
  {
    children: [{ text: 'AI-Powered Editing' }],
    type: 'h2'
  },
  {
    children: [
      { text: 'Boost your productivity with integrated ' },
      {
        children: [{ text: 'AI SDK' }],
        type: 'a',
        url: '/docs/ai'
      },
      { text: '. Press ' },
      { kbd: true, text: '⌘+J' },
      { text: ' or ' },
      { kbd: true, text: 'Space' },
      { text: ' in an empty line to:' }
    ],
    type: 'p'
  },
  {
    children: [{ text: 'Generate content (continue writing, summarize, explain)' }],
    indent: 1,
    listStyleType: 'disc',
    type: 'p'
  },
  {
    children: [{ text: 'Edit existing text (improve, fix grammar, change tone)' }],
    indent: 1,
    listStyleType: 'disc',
    type: 'p'
  },
  // Core Features Section (Combined)
  {
    children: [{ text: 'Rich Content Editing' }],
    type: 'h2'
  },
  {
    children: [
      { text: 'Structure your content with ' },
      {
        children: [{ text: 'headings' }],
        type: 'a',
        url: '/docs/heading'
      },
      { text: ', ' },
      {
        children: [{ text: 'lists' }],
        type: 'a',
        url: '/docs/list'
      },
      { text: ', and ' },
      {
        children: [{ text: 'quotes' }],
        type: 'a',
        url: '/docs/blockquote'
      },
      { text: '. Apply ' },
      {
        children: [{ text: 'marks' }],
        type: 'a',
        url: '/docs/basic-marks'
      },
      { text: ' like ' },
      { bold: true, text: 'bold' },
      { text: ', ' },
      { italic: true, text: 'italic' },
      { text: ', ' },
      { text: 'underline', underline: true },
      { text: ', ' },
      { strikethrough: true, text: 'strikethrough' },
      { text: ', and ' },
      { code: true, text: 'code' },
      { text: '. Use ' },
      {
        children: [{ text: 'autoformatting' }],
        type: 'a',
        url: '/docs/autoformat'
      },
      { text: ' for ' },
      {
        children: [{ text: 'Markdown' }],
        type: 'a',
        url: '/docs/markdown'
      },
      { text: '-like shortcuts (e.g., ' },
      { kbd: true, text: '* ' },
      { text: ' for lists, ' },
      { kbd: true, text: '# ' },
      { text: ' for H1).' }
    ],
    type: 'p'
  },
  {
    children: [
      {
        children: [
          {
            text: 'Blockquotes are great for highlighting important information.'
          }
        ],
        type: 'p'
      }
    ],
    type: 'blockquote'
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
    children: [
      { text: 'Create ' },
      {
        children: [{ text: 'links' }],
        type: 'a',
        url: '/docs/link'
      },
      { text: ', ' },
      {
        children: [{ text: '@mention' }],
        type: 'a',
        url: '/docs/mention'
      },
      { text: ' users like ' },
      { children: [{ text: '' }], type: 'mention', value: 'Alice' },
      { text: ', or insert ' },
      {
        children: [{ text: 'emojis' }],
        type: 'a',
        url: '/docs/emoji'
      },
      { text: ' ✨. Use the ' },
      {
        children: [{ text: 'slash command' }],
        type: 'a',
        url: '/docs/slash-command'
      },
      { text: ' (/) for quick access to elements.' }
    ],
    type: 'p'
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
    children: [
      {
        children: [
          {
            children: [{ children: [{ bold: true, text: 'Feature' }], type: 'p' }],
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
    ],
    type: 'table'
  },
  // Column layouts
  {
    children: [{ text: 'Column Layouts' }],
    type: 'h3'
  },
  {
    children: [
      {
        text: 'Organize content using flexible column layouts. The three-column layout below demonstrates equal-width columns:'
      }
    ],
    type: 'p'
  },
  {
    children: [
      {
        children: [
          {
            children: [{ text: 'Column 1' }],
            type: 'h4'
          },
          {
            children: [
              {
                text: 'This is the first column with some sample content. You can add any type of content here including text, images, lists, and more.'
              }
            ],
            type: 'p'
          },
          {
            children: [{ text: 'First item' }],
            indent: 1,
            listStyleType: 'disc',
            type: 'p'
          },
          {
            children: [{ text: 'Second item' }],
            indent: 1,
            listStyleType: 'disc',
            type: 'p'
          }
        ],
        type: 'column',
        width: '33.33%'
      },
      {
        children: [
          {
            children: [{ text: 'Column 2' }],
            type: 'h4'
          },
          {
            children: [
              {
                text: 'The middle column showcases different content types. Here you can see how '
              },
              { bold: true, text: 'bold text' },
              { text: ' and ' },
              { italic: true, text: 'italic text' },
              { text: ' work within columns.' }
            ],
            type: 'p'
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Important note: columns are fully responsive and work great on all devices.'
                  }
                ],
                type: 'p'
              }
            ],
            type: 'blockquote'
          }
        ],
        type: 'column',
        width: '33.33%'
      },
      {
        children: [
          {
            children: [{ text: 'Column 3' }],
            type: 'h4'
          },
          {
            children: [
              { text: 'The third column demonstrates links and other elements. Visit ' },
              {
                children: [{ text: 'Plate documentation' }],
                type: 'a',
                url: '/docs'
              },
              { text: ' for more information about column layouts.' }
            ],
            type: 'p'
          },
          {
            children: [{ text: 'You can also add code: ' }],
            type: 'p'
          },
          {
            children: [{ code: true, text: 'console.log("Hello from column 3!");' }],
            type: 'p'
          }
        ],
        type: 'column',
        width: '33.33%'
      }
    ],
    type: 'column_group'
  },
  {
    children: [{ text: "Here's a two-column layout with different proportions:" }],
    type: 'p'
  },
  {
    children: [
      {
        children: [
          {
            children: [{ text: 'Main Content (70%)' }],
            type: 'h4'
          },
          {
            children: [
              {
                text: 'This wider column contains the main content. It takes up 70% of the available width, making it perfect for primary content like articles, detailed descriptions, or main features.'
              }
            ],
            type: 'p'
          },
          {
            children: [{ text: 'You can include complex content structures:' }],
            type: 'p'
          },
          {
            children: [
              { children: [{ text: 'const createLayout = () => {' }], type: 'code_line' },
              { children: [{ text: '  return {' }], type: 'code_line' },
              { children: [{ text: '    columns: 2,' }], type: 'code_line' },
              { children: [{ text: '    widths: ["70%", "30%"]' }], type: 'code_line' },
              { children: [{ text: '  };' }], type: 'code_line' },
              { children: [{ text: '};' }], type: 'code_line' }
            ],
            lang: 'javascript',
            type: 'code_block'
          }
        ],
        type: 'column',
        width: '70%'
      },
      {
        children: [
          {
            children: [{ text: 'Sidebar (30%)' }],
            type: 'h4'
          },
          {
            children: [{ text: 'This narrower column works well for:' }],
            type: 'p'
          },
          {
            children: [{ text: 'Sidebars' }],
            indent: 1,
            listStyleType: 'disc',
            type: 'p'
          },
          {
            children: [{ text: 'Navigation menus' }],
            indent: 1,
            listStyleType: 'disc',
            type: 'p'
          },
          {
            children: [{ text: 'Call-to-action buttons' }],
            indent: 1,
            listStyleType: 'disc',
            type: 'p'
          },
          {
            children: [{ text: 'Quick facts' }],
            indent: 1,
            listStyleType: 'disc',
            type: 'p'
          },
          {
            children: [
              { text: 'The smaller width makes it perfect for supplementary information.' }
            ],
            type: 'p'
          }
        ],
        type: 'column',
        width: '30%'
      }
    ],
    type: 'column_group'
  },
  // Media Section
  {
    children: [{ text: 'Images and Media' }],
    type: 'h3'
  },
  {
    children: [
      {
        text: 'Embed rich media like images directly in your content. Supports '
      },
      {
        children: [{ text: 'Media uploads' }],
        type: 'a',
        url: '/docs/media'
      },
      {
        text: ' and '
      },
      {
        children: [{ text: 'drag & drop' }],
        type: 'a',
        url: '/docs/dnd'
      },
      {
        text: ' for a smooth experience.'
      }
    ],
    type: 'p'
  },
  {
    attributes: { align: 'center' },
    caption: [
      {
        children: [{ text: 'Images with captions provide context.' }],
        type: 'p'
      }
    ],
    children: [{ text: '' }],
    type: 'img',
    url: 'https://images.unsplash.com/photo-1712688930249-98e1963af7bd?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    width: '75%'
  },
  {
    children: [{ text: '' }],
    isUpload: true,
    name: 'sample.pdf',
    type: 'file',
    url: 'https://s26.q4cdn.com/900411403/files/doc_downloads/test.pdf'
  },
  {
    children: [{ text: '' }],
    type: 'audio',
    url: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3'
  },
  {
    children: [{ text: 'Table of Contents' }],
    type: 'h3'
  },
  {
    children: [{ text: '' }],
    type: 'toc'
  },
  {
    children: [{ text: '' }],
    type: 'p'
  }
];
