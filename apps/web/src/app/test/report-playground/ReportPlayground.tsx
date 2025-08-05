'use client';

import React, { useState } from 'react';
import { InputTextArea } from '@/components/ui/inputs/InputTextArea';
import type { ReportElements } from '@buster/server-shared/reports';
import { useQuery } from '@tanstack/react-query';
import { mainApiV2 } from '@/api/buster_rest/instances';
import { useDebounceEffect } from '@/hooks';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

import DynamicReportEditor from '@/components/ui/report/DynamicReportEditor';

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

  const logValueChanges = (value: ReportElements) => {
    console.log('value', value);
  };

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
      </div>
      <div className="bg-background h-full max-h-[calc(100vh-56px)] overflow-hidden rounded border shadow">
        <DynamicReportEditor
          value={usedValue}
          useFixedToolbarKit={true}
          readOnly={false}
          onValueChange={logValueChanges}
        />
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

const value: ReportElements = [
  {
    children: [
      {
        text: 'Welcome to the Plate Playground!',
        highlight: true
      }
    ],
    type: 'h1',
    align: 'center',
    id: '39ZlrKsOyn',
    lineHeight: 3
  },
  {
    children: [
      {
        text: 'sdfasdf'
      }
    ],
    icon: '😄',
    type: 'callout',
    id: 'KQ0_YKgdqy'
  },
  {
    type: 'p',
    id: 'k5Id6hcBYM',
    children: [
      {
        text: 'This is a todo list',
        subscript: false
      }
    ],
    indent: 1,
    checked: true,
    listStyleType: 'todo'
  },
  {
    type: 'p',
    id: 'rIfHWhomdr',
    children: [
      {
        text: ''
      },
      {
        children: [
          {
            text: ''
          }
        ],
        date: 'Sat Aug 02 2025',
        type: 'date',
        id: 'k4oDWCxlxA'
      },
      {
        text: ' '
      }
    ]
  },
  {
    children: [
      {
        text: ''
      }
    ],
    texExpression: '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
    type: 'equation',
    id: 'vhevwY_QDV'
  },
  {
    children: [
      {
        text: 'Experience a modern rich-text editor built with '
      },
      {
        children: [
          {
            text: 'Slate'
          }
        ],
        type: 'a',
        url: 'https://slatejs.org'
      },
      {
        text: ' and '
      },
      {
        children: [
          {
            text: 'React'
          }
        ],
        type: 'a',
        url: 'https://reactjs.org'
      },
      {
        text: ". This playground showcases just a part of Plate's capabilities. "
      },
      {
        children: [
          {
            text: 'Explore the documentation'
          }
        ],
        type: 'a',
        url: '/docs'
      },
      {
        fontSize: '20px',
        text: 'to disc',
        bold: true,
        italic: true,
        underline: true,
        strikethrough: true
      },
      {
        text: 'asdfsdf',
        fontSize: '20px',
        bold: true,
        italic: true,
        underline: true,
        strikethrough: true,
        code: true
      },
      {
        fontSize: '20px',
        bold: true,
        italic: true,
        underline: true,
        strikethrough: true,
        text: 'over more'
      }
    ],
    type: 'p',
    id: 'Llox2cXZMn'
  },
  {
    type: 'p',
    id: 'Iqzjz0jfiT',
    children: [
      {
        text: ''
      }
    ]
  },
  {
    children: [
      {
        text: ''
      }
    ],
    type: 'media_embed',
    id: '5Jhmx2kqLa',
    width: 420,
    url: 'https://www.youtube.com/embed/QrM39m22jH4?list=RDQrM39m22jH4',
    caption: [
      {
        text: 'That is some uh good content'
      }
    ]
  },
  {
    children: [
      {
        text: 'Getting Started with Numbered Lists'
      }
    ],
    type: 'h2',
    id: 'uVFp2MWU37'
  },
  {
    children: [
      {
        text: 'Here are the steps to create amazing content with Plate:'
      }
    ],
    type: 'p',
    id: '9fL-pyUzA6'
  },
  {
    children: [
      {
        text: 'Set up your Plate editor with the desired plugins'
      }
    ],
    indent: 1,
    listStyleType: 'decimal',
    type: 'p',
    id: '6aPrKNDEJS'
  },
  {
    children: [
      {
        text: 'Configure your editor theme and styling'
      }
    ],
    indent: 1,
    listStyleType: 'decimal',
    type: 'p',
    listStart: 2,
    id: 'Xxss8TEdUu'
  },
  {
    children: [
      {
        text: 'Start typing and explore the rich formatting options'
      }
    ],
    indent: 1,
    listStyleType: 'decimal',
    type: 'p',
    listStart: 3,
    id: '6JuWRwDKMy'
  },
  {
    children: [
      {
        text: 'Use keyboard shortcuts for faster editing'
      }
    ],
    indent: 1,
    listStyleType: 'decimal',
    type: 'p',
    listStart: 4,
    id: 'APjmNBgglC'
  },
  {
    children: [
      {
        text: 'Share your content with the world!'
      }
    ],
    indent: 1,
    listStyleType: 'decimal',
    type: 'p',
    listStart: 5,
    id: 'fxwYyMp-W4'
  },
  {
    children: [
      {
        text: 'You can also create nested numbered lists by increasing the indent level:'
      }
    ],
    type: 'p',
    id: '3iuYf_NelG'
  },
  {
    children: [
      {
        text: 'Main topic one'
      }
    ],
    indent: 1,
    listStyleType: 'decimal',
    type: 'p',
    id: '48g5K9--J_'
  },
  {
    children: [
      {
        text: 'Subtopic A'
      }
    ],
    indent: 2,
    listStyleType: 'decimal',
    type: 'p',
    id: 'C8CAAEEdEV'
  },
  {
    children: [
      {
        text: 'Subtopic B'
      }
    ],
    indent: 2,
    listStyleType: 'decimal',
    type: 'p',
    listStart: 2,
    id: 'ZH6sKNe9fu'
  },
  {
    children: [
      {
        text: 'Main topic two'
      }
    ],
    indent: 1,
    listStyleType: 'decimal',
    type: 'p',
    listStart: 2,
    id: 'a_uGe6WbqJ'
  },
  {
    children: [
      {
        text: 'Another subtopic'
      }
    ],
    indent: 2,
    listStyleType: 'decimal',
    type: 'p',
    id: '5qtJQ2K7Pn'
  },
  {
    children: [
      {
        text: 'AI-Powered Editing'
      }
    ],
    type: 'h2',
    id: 'txPqSPHKmY'
  },
  {
    children: [
      {
        text: 'Boost your productivity with integrated '
      },
      {
        children: [
          {
            text: 'AI SDK'
          }
        ],
        type: 'a',
        url: '/docs/ai'
      },
      {
        text: '. Press '
      },
      {
        kbd: true,
        text: '⌘+J'
      },
      {
        text: ' or '
      },
      {
        kbd: true,
        text: 'Space'
      },
      {
        text: ' in an empty line to:'
      }
    ],
    type: 'p',
    id: 'FFrl0YwO7w'
  },
  {
    children: [
      {
        text: 'Generate content (continue writing, summarize, explain)'
      }
    ],
    indent: 1,
    listStyleType: 'disc',
    type: 'p',
    id: 'BlrDanSHUf'
  },
  {
    children: [
      {
        text: 'Edit existing text (improve, fix grammar, change tone)'
      }
    ],
    indent: 1,
    listStyleType: 'disc',
    type: 'p',
    listStart: 2,
    id: 'wugYZ3VHvh'
  },
  {
    children: [
      {
        text: 'Rich Content Editing'
      }
    ],
    type: 'h2',
    id: 'IGCSGzeC8A'
  },
  {
    children: [
      {
        text: 'Structure your content with '
      },
      {
        children: [
          {
            text: 'headings'
          }
        ],
        type: 'a',
        url: '/docs/heading'
      },
      {
        text: ', '
      },
      {
        children: [
          {
            text: 'lists'
          }
        ],
        type: 'a',
        url: '/docs/list'
      },
      {
        text: ', and '
      },
      {
        children: [
          {
            text: 'quotes'
          }
        ],
        type: 'a',
        url: '/docs/blockquote'
      },
      {
        text: '. Apply '
      },
      {
        children: [
          {
            text: 'marks'
          }
        ],
        type: 'a',
        url: '/docs/basic-marks'
      },
      {
        text: ' like '
      },
      {
        bold: true,
        text: 'bold'
      },
      {
        text: ', '
      },
      {
        italic: true,
        text: 'italic'
      },
      {
        text: ', '
      },
      {
        text: 'underline',
        underline: true
      },
      {
        text: ', '
      },
      {
        strikethrough: true,
        text: 'strikethrough'
      },
      {
        text: ', and '
      },
      {
        code: true,
        text: 'code'
      },
      {
        text: '. Use '
      },
      {
        children: [
          {
            text: 'autoformatting'
          }
        ],
        type: 'a',
        url: '/docs/autoformat'
      },
      {
        text: ' for '
      },
      {
        children: [
          {
            text: 'Markdown'
          }
        ],
        type: 'a',
        url: '/docs/markdown'
      },
      {
        text: '-like shortcuts (e.g., '
      },
      {
        kbd: true,
        text: '* '
      },
      {
        text: ' for lists, '
      },
      {
        kbd: true,
        text: '# '
      },
      {
        text: ' for H1).'
      }
    ],
    type: 'p',
    id: 'pZu9wG2Nxw'
  },
  {
    children: [
      {
        children: [
          {
            text: 'Blockquotes are great for highlighting important information.'
          }
        ],
        type: 'p',
        id: 'ITbxU0Eu3O'
      }
    ],
    type: 'blockquote',
    id: 'KmM5FsYcvO'
  },
  {
    children: [
      {
        children: [
          {
            text: 'function hello() {'
          }
        ],
        type: 'code_line',
        id: 'Zwg134JSYa'
      },
      {
        children: [
          {
            text: "  console.info('Code blocks are supported!');"
          }
        ],
        type: 'code_line',
        id: 'n2HwdIw8KI'
      },
      {
        children: [
          {
            text: '}'
          }
        ],
        type: 'code_line',
        id: 'eUIPVWQexr'
      }
    ],
    lang: 'javascript',
    type: 'code_block',
    id: '7j5uY-KgBM'
  },
  {
    children: [
      {
        text: 'Create '
      },
      {
        children: [
          {
            text: 'links'
          }
        ],
        type: 'a',
        url: '/docs/link'
      },
      {
        text: ', '
      },
      {
        children: [
          {
            text: '@mention'
          }
        ],
        type: 'a',
        url: '/docs/mention'
      },
      {
        text: ' users like '
      },
      {
        children: [
          {
            text: ''
          }
        ],
        type: 'mention',
        value: 'Alice'
      },
      {
        text: ', or insert '
      },
      {
        children: [
          {
            text: 'emojis'
          }
        ],
        type: 'a',
        url: '/docs/emoji'
      },
      {
        text: ' ✨. Use the '
      },
      {
        children: [
          {
            text: 'slash command'
          }
        ],
        type: 'a',
        url: '/docs/slash-command'
      },
      {
        text: ' (/) for quick access to elements.'
      }
    ],
    type: 'p',
    id: 'Q6E348aAY5'
  },
  {
    children: [
      {
        text: 'How Plate Compares'
      }
    ],
    type: 'h3',
    id: 'O37OMS-4sT'
  },
  {
    children: [
      {
        text: 'Plate offers many features out-of-the-box as free, open-source plugins.'
      }
    ],
    type: 'p',
    id: 'fJF5tbfptp'
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
                    text: 'Feature'
                  }
                ],
                type: 'p',
                id: 'jZSxg15j0X'
              }
            ],
            type: 'th',
            id: 'PzvN9bP7YR'
          },
          {
            children: [
              {
                children: [
                  {
                    bold: true,
                    text: 'Plate (Free & OSS)'
                  }
                ],
                type: 'p',
                id: 'itcyiqrnTz'
              }
            ],
            type: 'th',
            id: 'PEKkOzGjeB'
          },
          {
            children: [
              {
                children: [
                  {
                    bold: true,
                    text: 'Tiptap'
                  }
                ],
                type: 'p',
                id: 'KO9rw5f7Uw'
              }
            ],
            type: 'th',
            id: 'jxFT_NCHsV'
          }
        ],
        type: 'tr',
        id: 'Pq_8pei9HQ'
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'AI'
                  }
                ],
                type: 'p',
                id: 't4cuPeAF_x'
              }
            ],
            type: 'td',
            id: 'o4z_XqV-_I'
          },
          {
            children: [
              {
                attributes: {
                  align: 'center'
                },
                children: [
                  {
                    text: '✅'
                  }
                ],
                type: 'p',
                id: 'wayohvxXaD'
              }
            ],
            type: 'td',
            id: 'Dw_Mot98Bb'
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Paid Extension'
                  }
                ],
                type: 'p',
                id: 'TT-8pEBhmD'
              }
            ],
            type: 'td',
            id: '48E1WQqSEP'
          }
        ],
        type: 'tr',
        id: 'A-3JLTmOZ9'
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Comments'
                  }
                ],
                type: 'p',
                id: 'aOBzJQxFn_'
              }
            ],
            type: 'td',
            id: 'AntbpRGgDL'
          },
          {
            children: [
              {
                attributes: {
                  align: 'center'
                },
                children: [
                  {
                    text: '✅'
                  }
                ],
                type: 'p',
                id: 'NT34Mf1m5P'
              }
            ],
            type: 'td',
            id: 'nZLoVUQYjU'
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Paid Extension'
                  }
                ],
                type: 'p',
                id: 'gZgu99PS6q'
              }
            ],
            type: 'td',
            id: 'sw4_Ix46ju'
          }
        ],
        type: 'tr',
        id: 'CXndh47goL'
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Suggestions'
                  }
                ],
                type: 'p',
                id: '80Iye_hdcn'
              }
            ],
            type: 'td',
            id: '6A-rbYgFqj'
          },
          {
            children: [
              {
                attributes: {
                  align: 'center'
                },
                children: [
                  {
                    text: '✅'
                  }
                ],
                type: 'p',
                id: 'MJuA59koma'
              }
            ],
            type: 'td',
            id: 'YSkStFgAzz'
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Paid (Comments Pro)'
                  }
                ],
                type: 'p',
                id: 'ZVeC0p5Rlb'
              }
            ],
            type: 'td',
            id: '9IqOFYTHZt'
          }
        ],
        type: 'tr',
        id: 'MVEfnNAQ1C'
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Emoji Picker'
                  }
                ],
                type: 'p',
                id: 'oxmATMIWsE'
              }
            ],
            type: 'td',
            id: 'pLKtzHUOOB'
          },
          {
            children: [
              {
                attributes: {
                  align: 'center'
                },
                children: [
                  {
                    text: '✅'
                  }
                ],
                type: 'p',
                id: 'gZzLqRDSRG'
              }
            ],
            type: 'td',
            id: '672S3mPjZk'
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Paid Extension'
                  }
                ],
                type: 'p',
                id: 'vwQ2m0F-UG'
              }
            ],
            type: 'td',
            id: 'hBSmdsqQfj'
          }
        ],
        type: 'tr',
        id: 'np1EFC5YQ3'
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Table of Contents'
                  }
                ],
                type: 'p',
                id: 'ndl0A56x4k'
              }
            ],
            type: 'td',
            id: 'DUiadWPL9c'
          },
          {
            children: [
              {
                attributes: {
                  align: 'center'
                },
                children: [
                  {
                    text: '✅'
                  }
                ],
                type: 'p',
                id: 'Cjp20AiCvu'
              }
            ],
            type: 'td',
            id: 'eLrUKAraot'
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Paid Extension'
                  }
                ],
                type: 'p',
                id: 'OzV2vqciSZ'
              }
            ],
            type: 'td',
            id: 'CQ9eNMxFQH'
          }
        ],
        type: 'tr',
        id: '8t7lSFAW2p'
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Drag Handle'
                  }
                ],
                type: 'p',
                id: 'mxjVDQZGGV'
              }
            ],
            type: 'td',
            id: '0CB3YGdPVw'
          },
          {
            children: [
              {
                attributes: {
                  align: 'center'
                },
                children: [
                  {
                    text: '✅'
                  }
                ],
                type: 'p',
                id: 'LdwnL_F4Ub'
              }
            ],
            type: 'td',
            id: 'gQb6Dwh7xp'
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Paid Extension'
                  }
                ],
                type: 'p',
                id: 'Nnpbs3EITR'
              }
            ],
            type: 'td',
            id: 'OtY2PMMHTz'
          }
        ],
        type: 'tr',
        id: 'aHXl-ykqAA'
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Collaboration (Yjs)'
                  }
                ],
                type: 'p',
                id: 'MpFN0nX0k5'
              }
            ],
            type: 'td',
            id: 'FqHQdVhokR'
          },
          {
            children: [
              {
                attributes: {
                  align: 'center'
                },
                children: [
                  {
                    text: '✅'
                  }
                ],
                type: 'p',
                id: 'hLIQSN9dMk'
              }
            ],
            type: 'td',
            id: 'pAbEplNjxi'
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Hocuspocus (OSS/Paid)'
                  }
                ],
                type: 'p',
                id: 'p7yHA1yltS'
              }
            ],
            type: 'td',
            id: 'QjBMsCkSFk'
          }
        ],
        type: 'tr',
        id: 'LUKaRL_DDI'
      }
    ],
    type: 'table',
    id: 'uOTr05y4gj'
  },
  {
    children: [
      {
        text: 'Column Layouts'
      }
    ],
    type: 'h3',
    id: 'YEWxvvRlVz'
  },
  {
    children: [
      {
        text: 'Organize content using flexible column layouts. The three-column layout below demonstrates equal-width columns:'
      }
    ],
    type: 'p',
    id: '78pmKc0cmt'
  },
  {
    children: [
      {
        children: [
          {
            children: [
              {
                text: 'Column 1'
              }
            ],
            type: 'h4',
            id: 'zV9WpaQmiM'
          },
          {
            children: [
              {
                text: 'This is the first column with some sample content. You can add any type of content here including text, images, lists, and more.'
              }
            ],
            type: 'p',
            id: '-wwC-tNGW4'
          },
          {
            children: [
              {
                text: 'First item'
              }
            ],
            indent: 1,
            listStyleType: 'disc',
            type: 'p',
            id: 'cPfXlwoZXC'
          },
          {
            children: [
              {
                text: 'Second item'
              }
            ],
            indent: 1,
            listStyleType: 'disc',
            type: 'p',
            listStart: 2,
            id: 'zq06sh_wR7'
          }
        ],
        type: 'column',
        width: '33.333333333333336%',
        id: '3KxHhc72fo'
      },
      {
        children: [
          {
            children: [
              {
                text: 'Column 2'
              }
            ],
            type: 'h4',
            id: 'wy0lohnoyH'
          },
          {
            children: [
              {
                text: 'The middle column showcases different content types. Here you can see how '
              },
              {
                bold: true,
                text: 'bold text'
              },
              {
                text: ' and '
              },
              {
                italic: true,
                text: 'italic text'
              },
              {
                text: ' work within columns.'
              }
            ],
            type: 'p',
            id: 'QRwE6C8504'
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Important note: columns are fully responsive and work great on all devices.'
                  }
                ],
                type: 'p',
                id: 'bzYJXeenCp'
              }
            ],
            type: 'blockquote',
            id: 'aKRIP-3Mq0'
          }
        ],
        type: 'column',
        width: '33.333333333333336%',
        id: 'JsfqHDupDi'
      },
      {
        children: [
          {
            children: [
              {
                text: 'Column 3'
              }
            ],
            type: 'h4',
            id: '26fOLH6PBs'
          },
          {
            children: [
              {
                text: 'The third column demonstrates links and other elements. Visit '
              },
              {
                children: [
                  {
                    text: 'Plate documentation'
                  }
                ],
                type: 'a',
                url: '/docs'
              },
              {
                text: ' for more information about column layouts.'
              }
            ],
            type: 'p',
            id: 'Rp0vZ8-fKd'
          },
          {
            children: [
              {
                text: 'You can also add code: '
              }
            ],
            type: 'p',
            id: 'b00D7ovSJq'
          },
          {
            children: [
              {
                code: true,
                text: 'console.log("Hello from column 3!");'
              }
            ],
            type: 'p',
            id: 'WKKr4KJ7Du'
          }
        ],
        type: 'column',
        width: '33.333333333333336%',
        id: 'J2gL1qFD_L'
      }
    ],
    type: 'column_group',
    id: 'ZSjVcBeqTz'
  },
  {
    children: [
      {
        text: "Here's a two-column layout with different proportions:"
      }
    ],
    type: 'p',
    id: 'MhLRaM1WL2'
  },
  {
    children: [
      {
        children: [
          {
            children: [
              {
                text: 'Main Content (70%)'
              }
            ],
            type: 'h4',
            id: 'cKRuGgXfHJ'
          },
          {
            children: [
              {
                text: 'This wider column contains the main content. It takes up 70% of the available width, making it perfect for primary content like articles, detailed descriptions, or main features.'
              }
            ],
            type: 'p',
            id: 'E6W64RXXKP'
          },
          {
            children: [
              {
                text: 'You can include complex content structures:'
              }
            ],
            type: 'p',
            id: 'kgiuyBPa4h'
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'const createLayout = () => {'
                  }
                ],
                type: 'code_line',
                id: 'RgljOLiwRu'
              },
              {
                children: [
                  {
                    text: '  return {'
                  }
                ],
                type: 'code_line',
                id: 'FbrVxRiYTJ'
              },
              {
                children: [
                  {
                    text: '    columns: 2,'
                  }
                ],
                type: 'code_line',
                id: 'YlhnXvzSaO'
              },
              {
                children: [
                  {
                    text: '    widths: ["70%", "30%"]'
                  }
                ],
                type: 'code_line',
                id: '1mZxnoLrld'
              },
              {
                children: [
                  {
                    text: '  };'
                  }
                ],
                type: 'code_line',
                id: 'vAGaGmgxKT'
              },
              {
                children: [
                  {
                    text: '};'
                  }
                ],
                type: 'code_line',
                id: 'R_Ci-hSY-W'
              }
            ],
            lang: 'javascript',
            type: 'code_block',
            id: 'l0DI9267RH'
          }
        ],
        type: 'column',
        width: '70%',
        id: 'qB2lxjr6od'
      },
      {
        children: [
          {
            children: [
              {
                text: 'Sidebar (30%)'
              }
            ],
            type: 'h4',
            id: '1WSJKN6qVt'
          },
          {
            children: [
              {
                text: 'This narrower column works well for:'
              }
            ],
            type: 'p',
            id: 'G0cnYrghoV'
          },
          {
            children: [
              {
                text: 'Sidebars'
              }
            ],
            indent: 1,
            listStyleType: 'disc',
            type: 'p',
            id: 'jOmKJoVpre'
          },
          {
            children: [
              {
                text: 'Navigation menus'
              }
            ],
            indent: 1,
            listStyleType: 'disc',
            type: 'p',
            listStart: 2,
            id: '3phtzxP42Y'
          },
          {
            children: [
              {
                text: 'Call-to-action buttons'
              }
            ],
            indent: 1,
            listStyleType: 'disc',
            type: 'p',
            listStart: 3,
            id: '1uUYuqPkAk'
          },
          {
            children: [
              {
                text: 'Quick facts'
              }
            ],
            indent: 1,
            listStyleType: 'disc',
            type: 'p',
            listStart: 4,
            id: 'I-4nFTUvbh'
          },
          {
            children: [
              {
                text: 'The smaller width makes it perfect for supplementary information.'
              }
            ],
            type: 'p',
            id: '3XCWIJRTD9'
          }
        ],
        type: 'column',
        width: '30%',
        id: 'wGw63ffOdy'
      }
    ],
    type: 'column_group',
    id: 'BHL22bIne1'
  },
  {
    children: [
      {
        text: 'Images and Media'
      }
    ],
    type: 'h3',
    id: 'E5rDpXd8oo'
  },
  {
    children: [
      {
        text: 'Embed rich media like images directly in your content. Supports '
      },
      {
        children: [
          {
            text: 'Media uploads'
          }
        ],
        type: 'a',
        url: '/docs/media'
      },
      {
        text: ' and '
      },
      {
        children: [
          {
            text: 'drag & drop'
          }
        ],
        type: 'a',
        url: '/docs/dnd'
      },
      {
        text: ' for a smooth experience.'
      }
    ],
    type: 'p',
    id: 'bkPMkFT94k'
  },
  {
    attributes: {
      align: 'center'
    },
    caption: [
      {
        children: [
          {
            text: 'Images with captions provide context.'
          }
        ],
        type: 'p'
      }
    ],
    children: [
      {
        text: ''
      }
    ],
    type: 'img',
    url: 'https://images.unsplash.com/photo-1712688930249-98e1963af7bd?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    width: '75%',
    id: 'U-HzwXo6Vr'
  },
  {
    children: [
      {
        text: ''
      }
    ],
    isUpload: true,
    name: 'sample.pdf',
    type: 'file',
    url: 'https://s26.q4cdn.com/900411403/files/doc_downloads/test.pdf',
    id: 'NMVIM7USb5'
  },
  {
    children: [
      {
        text: ''
      }
    ],
    type: 'audio',
    url: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3',
    id: 'cyntEGWuLW'
  },
  {
    children: [
      {
        text: 'Table of Contents'
      }
    ],
    type: 'h3',
    id: 'a7dmg-Stew'
  },
  {
    children: [
      {
        text: ''
      }
    ],
    type: 'toc',
    id: '6r_iC7l7c8'
  },
  {
    children: [
      {
        text: ''
      }
    ],
    type: 'p',
    id: '_y8HfJpLPb'
  }
];
