import type { Value } from 'platejs';
import { createPlateEditor } from 'platejs/react';
import { describe, expect, it } from 'vitest';
import { EditorKit } from '../../editor-kit';
import { markdownToPlatejs, platejsToMarkdown } from './platejs-conversions';

export const editor = createPlateEditor({
  plugins: EditorKit({ scrollAreaRef: undefined, mode: 'default' }),
});

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
    const platejs = await markdownToPlatejs(editor, markdown);
    expect(platejs).toBeDefined();
  });

  it('real world markdown', async () => {
    const markdown = `Our most popular mountain bike over the last 12 months is Mountain-200 Black, 38 with 825 units sold.
## Key Findings
- The top-selling mountain bike model is **Mountain-200 Black, 38**.
- It sold **825 units** in the last 12 months.
## Metric
<metric metricId="d3bf75d2-28f7-408e-93ec-ae06b509ad27" />
## Context
- I focused specifically on complete bicycle products in the **Mountain Bikes** subcategory within the broader **Bikes** category to avoid counting components or frames.
- I measured popularity by **units sold**, which reflects the number of bikes customers purchased.
- Timeframe defaults to the **last 12 months** to show a current view.
## Methodology
- Data sources: Sales order lines and headers, and product catalog tables in the operational analytics database.
- Filters:
  - Product Category = "Bikes"
  - Product Subcategory = "Mountain Bikes"
  - Order Date between CURRENT_DATE - 12 months and CURRENT_DATE
- Calculation:
  - For each mountain bike product, sum of sales order quantities from sales order details.
  - Select the product with the highest total units sold.
- Notes on definitions:
  - "Most popular" defined as highest **units sold**; alternative definitions could use revenue or number of distinct orders, but units sold most directly represents product popularity by volume.
  - Product names are used as the display label to identify the specific model.
- Alternatives considered:
  - Using revenue-based popularity could favor higher-priced bikes; I chose units to avoid price bias.
  - Using the riding discipline filter (e.g., Mountain) was considered, but I used the explicit Mountain Bikes subcategory to exclude components.
`;

    const elements = await markdownToPlatejs(editor, markdown);
    expect(elements).toBeDefined();
  });

  it('real world example 2', async () => {
    const markdown = `      Our top sales reps differentiate themselves by building larger, more customized orders with more line items per deal. Bottom reps tend to have small, simple orders with minimal customization. Discounting does not appear to be a differentiator.

        ## Executive Summary
        - I analyzed sales rep performance and behaviors over the last 12 months.
        - Top performers (top 20% by revenue handled) consistently:
          - Handle more orders and revenue overall
          - Build bigger baskets: more line items per order
          - Drive more customized solutions
        - Bottom performers (bottom 20%) typically:
          - Have very low order counts and revenue
          - Submit orders with few line items
          - Have far fewer customized orders
        - Pricing/discount behavior is not a strong differentiator: realized price vs list is ~99–100% across groups.

        ## Key Findings
        - Larger baskets and customization correlate with top performance.
        - Price-driven decision context is common across all reps; it does not separate top from bottom.
        - Consultation flag appears on all rep-led orders; it does not differentiate performance.

        ## Metrics
        These visuals show how behaviors differ by rep segment.

        ### Segment overview: top-to-bottom quintiles
        <metric metricId="TBD-QUINTILE-SUMMARY" />

        ### Rep list: names and segments
        <metric metricId="TBD-REP-SEGMENT-LIST" />

        ### Behavior detail by rep
        <metric metricId="TBD-REP-BEHAVIOR-DETAIL" />

        ## What top reps do differently
        - Build larger orders: significantly higher average lines per order.
        - Sell more customized solutions: higher share of orders with customization (Standard Options/Minor Adjustments/Significant Customization/Custom Build).
        - Maintain price integrity similar to peers (no evidence of heavier discounting).

        ## What hurts bottom reps
        - Very low activity: few orders and small baskets.
        - Minimal customization: many stock-only orders.
        - No evidence of offsetting with price tactics; realized price ratios remain similar to others.

        ## Recommendations
        1. Train for solution-building: bundle complementary items to increase lines per order.
        2. Promote customization playbooks: encourage offering configurable options where applicable.
        3. Activity focus for bottom reps: targeted pipelines to increase order count.
        4. Monitor product mix: emphasize categories that lend to multi-line, customizable deals.

        ## Methodology
        - Data sources: ont_ont.sales_order_header, ont_ont.sales_order_detail, ont_ont.sales_person, ont_ont.person, ont_ont.product.
        - Scope: Last 12 months from today; only orders attributed to a salesperson (salespersonid not null).
        - Ranking: Reps ranked by total revenue handled over the last 12 months and split into quintiles; "Top performers" are top 20%; "Bottom performers" are bottom 20%.
        - Behavior metrics per rep:
          - Orders count, total revenue, average order value
          - Average lines per order (proxy for cross-sell/basket size)
          - Customization presence: share of orders tagged as customized (Standard Options, Minor Adjustments, Significant Customization, Custom Build) vs Stock
          - Realized price ratio: linetotal / (unitprice*qty) at order level averaged per rep
          - Decision context: share of orders marked Price-driven vs Value-driven
        - Not differentiating factors:
          - Consultation-level flag was present on all rep-led orders in this period
          - Realized price ratio averaged ~0.996–0.999 across groups (minimal discounting)
        - Notes and assumptions:
          - Where behavior fields were missing at line level, I computed order-level summaries then averaged per rep.
          - Product mix details are available but were not required for core conclusions; can be added if needed.`;

    const elements = await markdownToPlatejs(editor, markdown);
    expect(elements).toBeDefined();
    const firstMetric = elements.find((element) => element.type === 'metric');
    expect(firstMetric).toBeDefined();
    expect(firstMetric?.metricId).toBe('TBD-QUINTILE-SUMMARY');
  });

  it('should convert markdown to platejs with a metric', async () => {
    const markdownWithBulletList = `
    # Bullet List Example

    - Bullet list item 1
    - Bullet list item 2
    - Bullet list item 3
    `;

    const elements = await markdownToPlatejs(editor, markdownWithBulletList);

    const firstElement = elements[0];
    expect(firstElement.type).toBe('h1');
    expect(firstElement.children[0]).toEqual({ text: 'Bullet List Example' });

    const secondElement = elements[1];
    expect(secondElement.type).toBe('p');
    expect(secondElement.children[0]).toEqual({ text: 'Bullet list item 1' });

    const thirdElement = elements[2];
    expect(thirdElement.type).toBe('p');
    expect((thirdElement as any).listStyleType).toBe('disc');
    expect(thirdElement.children[0]).toEqual({ text: 'Bullet list item 2' });
  });

  it('dollar sign', async () => {
    const markdown = `Top performers balance volume and value across purchase contexts:
- **High-volume replacement parts** (1,088 orders, $16M revenue)
- **High-value maintenance & upgrade** (535 orders, $21.4M revenue)`;

    const elements = await markdownToPlatejs(editor, markdown);
    expect(elements).toBeDefined();
    const firstElement = elements[0];
    expect(firstElement.type).toBe('p');
    expect(firstElement.children[0]).toEqual({
      text: 'Top performers balance volume and value across purchase contexts:',
    });
    expect(elements).toEqual([
      {
        id: 'id-0',
        children: [
          {
            text: 'Top performers balance volume and value across purchase contexts:',
          },
        ],
        type: 'p',
      },
      {
        id: 'id-1',
        children: [
          {
            bold: true,
            text: 'High-volume replacement parts',
          },
          {
            text: ' (1,088 orders, $16M revenue)',
          },
        ],
        type: 'p',
        indent: 1,
        listStyleType: 'disc',
      },
      {
        id: 'id-2',
        children: [
          {
            bold: true,
            text: 'High-value maintenance & upgrade',
          },
          {
            text: ' (535 orders, $21.4M revenue)',
          },
        ],
        type: 'p',
        indent: 1,
        listStyleType: 'disc',
      },
    ]);
  });

  it('callout', async () => {
    const markdown = `<callout icon="💡" content="Testing123"></callout>`;
    const elements = await markdownToPlatejs(editor, markdown);
    const firstElement = elements[0];
    expect(firstElement.type).toBe('callout');
    expect(firstElement.icon).toBe('💡');
    expect(firstElement.children[0]).toEqual({ type: 'p', children: [{ text: 'Testing123' }] });
  });

  it('callout and a metric', async () => {
    const markdown = `<metric metricId="33af38a8-c40f-437d-98ed-1ec78ce35232" width="100%" caption=""></metric>

<callout icon="💡">Testing123</callout>`;
    const elements = await markdownToPlatejs(editor, markdown);
    expect(elements).toBeDefined();
    const firstElement = elements[0];
    expect(firstElement.type).toBe('metric');
    expect(firstElement.metricId).toBe('33af38a8-c40f-437d-98ed-1ec78ce35232');
  });
});

describe('platejsToMarkdown', () => {
  it('should convert platejs to markdown', async () => {
    const markdown = `This is a simple paragraph.\n`;
    const elements: Value = [
      {
        type: 'p',
        children: [
          {
            text: 'This is a simple paragraph.',
          },
        ],
      },
    ];
    const markdown2 = await platejsToMarkdown(editor, elements);
    expect(markdown2).toBe(markdown);
  });

  it('should convert callout platejs element to markdown', async () => {
    const elements: Value = [
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
    const markdown2 = await platejsToMarkdown(editor, elements);
    const markdown = `# Main Title\n\nThis paragraph has **bold text** in it.\n`;
    expect(markdown2).toBe(markdown);
  });

  it('should convert callout platejs element to markdown', async () => {
    const elements: Value = [
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
    const markdownFromPlatejs = await platejsToMarkdown(editor, elements);

    const expectedMarkdown = `<callout icon="⚠️" content="This is a simple paragraph.
"></callout>`;
    expect(markdownFromPlatejs.trim()).toBe(expectedMarkdown.trim());
  });

  it('should convert callout platejs element to markdown', async () => {
    const elements: Value = [
      {
        children: [
          {
            text: 'Our most popular mountain bike over the last 12 months is Mountain-200 Black, 38 with 825 units sold.',
          },
        ],
        type: 'p',
      },
      {
        children: [
          {
            text: 'Key Findings',
          },
        ],
        type: 'h2',
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'The top-selling mountain bike model is ',
                  },
                  {
                    bold: true,
                    text: 'Mountain-200 Black, 38',
                  },
                  {
                    text: '.',
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
                    text: 'It sold ',
                  },
                  {
                    bold: true,
                    text: '825 units',
                  },
                  {
                    text: ' in the last 12 months.',
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
            text: 'Metric',
          },
        ],
        type: 'h2',
      },
      {
        children: [
          {
            text: '<metric>\n',
          },
          {
            text: '',
          },
          {
            text: '\n</metric>',
          },
        ],
        type: 'p',
      },
      {
        children: [
          {
            text: 'Context',
          },
        ],
        type: 'h2',
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'I focused specifically on complete bicycle products in the ',
                  },
                  {
                    bold: true,
                    text: 'Mountain Bikes',
                  },
                  {
                    text: ' subcategory within the broader ',
                  },
                  {
                    bold: true,
                    text: 'Bikes',
                  },
                  {
                    text: ' category to avoid counting components or frames.',
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
                    text: 'I measured popularity by ',
                  },
                  {
                    bold: true,
                    text: 'units sold',
                  },
                  {
                    text: ', which reflects the number of bikes customers purchased.',
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
                    text: 'Timeframe defaults to the ',
                  },
                  {
                    bold: true,
                    text: 'last 12 months',
                  },
                  {
                    text: ' to show a current view.',
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
            text: 'Methodology',
          },
        ],
        type: 'h2',
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Data sources: Sales order lines and headers, and product catalog tables in the operational analytics database.',
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
                    text: 'Filters:',
                  },
                ],
                type: 'lic',
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [
                          {
                            text: 'Product Category = "Bikes"',
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
                            text: 'Product Subcategory = "Mountain Bikes"',
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
                            text: 'Order Date between CURRENT_DATE - 12 months and CURRENT_DATE',
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
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Calculation:',
                  },
                ],
                type: 'lic',
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [
                          {
                            text: 'For each mountain bike product, sum of sales order quantities from sales order details.',
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
                            text: 'Select the product with the highest total units sold.',
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
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Notes on definitions:',
                  },
                ],
                type: 'lic',
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [
                          {
                            text: '"Most popular" defined as highest ',
                          },
                          {
                            bold: true,
                            text: 'units sold',
                          },
                          {
                            text: '; alternative definitions could use revenue or number of distinct orders, but units sold most directly represents product popularity by volume.',
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
                            text: 'Product names are used as the display label to identify the specific model.',
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
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Alternatives considered:',
                  },
                ],
                type: 'lic',
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [
                          {
                            text: 'Using revenue-based popularity could favor higher-priced bikes; I chose units to avoid price bias.',
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
                            text: 'Using the riding discipline filter (e.g., Mountain) was considered, but I used the explicit Mountain Bikes subcategory to exclude components.',
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
            ],
            type: 'li',
          },
        ],
        type: 'ul',
      },
    ];

    const markdownFromPlatejs = await platejsToMarkdown(editor, elements);

    expect(markdownFromPlatejs).toBeDefined();
  });

  it('should convert real world example 2', async () => {
    const elements: Value = [
      {
        children: [
          {
            text: 'Our top sales reps differentiate themselves by building larger, more customized orders with more line items per deal. Bottom reps tend to have small, simple orders with minimal customization. Discounting does not appear to be a differentiator.',
          },
        ],
        type: 'p',
      },
      { children: [{ text: 'Executive Summary' }], type: 'h2' },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'I analyzed sales rep performance and behaviors over the last 12 months.',
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
                    text: 'Top performers (top 20% by revenue handled) consistently:',
                  },
                ],
                type: 'lic',
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [{ text: 'Handle more orders and revenue overall' }],
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
                            text: 'Build bigger baskets: more line items per order',
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
                        children: [{ text: 'Drive more customized solutions' }],
                        type: 'lic',
                      },
                    ],
                    type: 'li',
                  },
                ],
                type: 'ul',
              },
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [{ text: 'Bottom performers (bottom 20%) typically:' }],
                type: 'lic',
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [{ text: 'Have very low order counts and revenue' }],
                        type: 'lic',
                      },
                    ],
                    type: 'li',
                  },
                  {
                    children: [
                      {
                        children: [{ text: 'Submit orders with few line items' }],
                        type: 'lic',
                      },
                    ],
                    type: 'li',
                  },
                  {
                    children: [
                      {
                        children: [{ text: 'Have far fewer customized orders' }],
                        type: 'lic',
                      },
                    ],
                    type: 'li',
                  },
                ],
                type: 'ul',
              },
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [
                  {
                    text: 'Pricing/discount behavior is not a strong differentiator: realized price vs list is ~99–100% across groups.',
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
      { children: [{ text: 'Key Findings' }], type: 'h2' },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Larger baskets and customization correlate with top performance.',
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
                    text: 'Price-driven decision context is common across all reps; it does not separate top from bottom.',
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
                    text: 'Consultation flag appears on all rep-led orders; it does not differentiate performance.',
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
      { children: [{ text: 'Metrics' }], type: 'h2' },
      {
        children: [{ text: 'These visuals show how behaviors differ by rep segment.' }],
        type: 'p',
      },
      {
        children: [{ text: 'Segment overview: top-to-bottom quintiles' }],
        type: 'h3',
      },
      {
        type: 'metric',
        metricId: 'TBD-QUINTILE-SUMMARY',
        children: [{ text: '' }],
      },
      { children: [{ text: 'Rep list: names and segments' }], type: 'h3' },
      {
        type: 'metric',
        metricId: 'TBD-REP-SEGMENT-LIST',
        children: [{ text: '' }],
      },
      { children: [{ text: 'Behavior detail by rep' }], type: 'h3' },
      {
        type: 'metric',
        metricId: 'TBD-REP-BEHAVIOR-DETAIL',
        children: [{ text: '' }],
      },
      { children: [{ text: 'What top reps do differently' }], type: 'h2' },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Build larger orders: significantly higher average lines per order.',
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
                    text: 'Sell more customized solutions: higher share of orders with customization (Standard Options/Minor Adjustments/Significant Customization/Custom Build).',
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
                    text: 'Maintain price integrity similar to peers (no evidence of heavier discounting).',
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
      { children: [{ text: 'What hurts bottom reps' }], type: 'h2' },
      {
        children: [
          {
            children: [
              {
                children: [{ text: 'Very low activity: few orders and small baskets.' }],
                type: 'lic',
              },
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [{ text: 'Minimal customization: many stock-only orders.' }],
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
                    text: 'No evidence of offsetting with price tactics; realized price ratios remain similar to others.',
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
      { children: [{ text: 'Recommendations' }], type: 'h2' },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Train for solution-building: bundle complementary items to increase lines per order.',
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
                    text: 'Promote customization playbooks: encourage offering configurable options where applicable.',
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
                    text: 'Activity focus for bottom reps: targeted pipelines to increase order count.',
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
                    text: 'Monitor product mix: emphasize categories that lend to multi-line, customizable deals.',
                  },
                ],
                type: 'lic',
              },
            ],
            type: 'li',
          },
        ],
        type: 'ol',
      },
      { children: [{ text: 'Methodology' }], type: 'h2' },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    text: 'Data sources: ont_ont.sales_order_header, ont_ont.sales_order_detail, ont_ont.sales_person, ont_ont.person, ont_ont.product.',
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
                    text: 'Scope: Last 12 months from today; only orders attributed to a salesperson (salespersonid not null).',
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
                    text: 'Ranking: Reps ranked by total revenue handled over the last 12 months and split into quintiles; "Top performers" are top 20%; "Bottom performers" are bottom 20%.',
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
                children: [{ text: 'Behavior metrics per rep:' }],
                type: 'lic',
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [
                          {
                            text: 'Orders count, total revenue, average order value',
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
                            text: 'Average lines per order (proxy for cross-sell/basket size)',
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
                            text: 'Customization presence: share of orders tagged as customized (Standard Options, Minor Adjustments, Significant Customization, Custom Build) vs Stock',
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
                            text: 'Realized price ratio: linetotal / (unitprice*qty) at order level averaged per rep',
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
                            text: 'Decision context: share of orders marked Price-driven vs Value-driven',
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
            ],
            type: 'li',
          },
          {
            children: [
              {
                children: [{ text: 'Not differentiating factors:' }],
                type: 'lic',
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [
                          {
                            text: 'Consultation-level flag was present on all rep-led orders in this period',
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
                            text: 'Realized price ratio averaged ~0.996–0.999 across groups (minimal discounting)',
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
            ],
            type: 'li',
          },
          {
            children: [
              { children: [{ text: 'Notes and assumptions:' }], type: 'lic' },
              {
                children: [
                  {
                    children: [
                      {
                        children: [
                          {
                            text: 'Where behavior fields were missing at line level, I computed order-level summaries then averaged per rep.',
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
                            text: 'Product mix details are available but were not required for core conclusions; can be added if needed.',
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
            ],
            type: 'li',
          },
        ],
        type: 'ul',
      },
    ];
    const markdownFromPlatejs = await platejsToMarkdown(editor, elements);
    expect(markdownFromPlatejs).toBeDefined();
    expect(markdownFromPlatejs).toContain('<metric metricId="TBD-REP-SEGMENT-LIST"');
  });

  it('basic caption', async () => {
    const elements: Value = [
      {
        type: 'img',
        children: [
          {
            text: '',
          },
        ],
        url: 'https://picsum.photos/200/200',
        caption: [
          {
            text: 'This is a caption...',
          },
        ],
        id: 'eIIq6-rQ1X',
      },
    ];
    const markdownFromPlatejs = await platejsToMarkdown(editor, elements);
    expect(markdownFromPlatejs).toBeDefined();
    expect(markdownFromPlatejs).toContain(
      '![This is a caption...](https://picsum.photos/200/200 "This is a caption...")'
    );
  });

  it('basic metric caption', async () => {
    const elements: Value = [
      {
        type: 'metric',
        children: [
          {
            text: '',
          },
        ],
        metricId: '1234',
        caption: [
          {
            text: 'This is a caption.. AND IT REALLY WORKS!',
          },
        ],
        id: 'YGbwsH2r0l',
      },
    ];
    const markdownFromPlatejs = await platejsToMarkdown(editor, elements);
    expect(markdownFromPlatejs).toBeDefined();
    expect(markdownFromPlatejs).toContain(
      '<metric metricId="1234" versionNumber="" width="100%" caption="This is a caption.. AND IT REALLY WORKS!"></metric>'
    );
  });

  it('two metrics', async () => {
    const elements: Value = [
      {
        type: 'metric',
        children: [
          {
            text: '',
          },
        ],
        metricId: 'nate-rulez',
        caption: [
          {
            text: 'Cool',
          },
        ],
        id: 'nate-rulez',
      },
      {
        type: 'metric',
        children: [
          {
            text: '',
          },
        ],
        metricId: 'wells-droolz',
        caption: [
          {
            text: 'Wow',
          },
        ],
        id: 'wells-droolz',
      },
    ];
    const markdownFromPlatejs = await platejsToMarkdown(editor, elements);
    expect(markdownFromPlatejs).toBeDefined();
    expect(markdownFromPlatejs).toContain(
      '<metric metricId="nate-rulez" versionNumber="" width="100%" caption="Cool"></metric>'
    );
    expect(markdownFromPlatejs).toContain(
      '<metric metricId="wells-droolz" versionNumber="" width="100%" caption="Wow"></metric>'
    );
    expect(markdownFromPlatejs).not.toContain('\\metric');
  });
});

describe('platejs to markdown and back to platejs', () => {
  const stripIds = (els: Value | Value): Value =>
    JSON.parse(JSON.stringify(els, (key, value) => (key === 'id' ? undefined : value))) as Value;

  it('should convert a simple list', async () => {
    const elements: Value = [{ id: 'id-0', type: 'h1', children: [{ text: 'Hello World' }] }];
    const markdown = await platejsToMarkdown(editor, elements);
    const elementsFromMarkdown = await markdownToPlatejs(editor, markdown);
    expect(elementsFromMarkdown).toEqual(elements);
  });

  it('should convert a simply report', async () => {
    const elements: Value = [
      {
        type: 'h1',
        children: [
          {
            text: 'Welcome to the Report Editor',
          },
        ],
        id: 'Vz_fc9l3OV',
      },
      {
        type: 'p',
        children: [
          {
            text: 'This is a sample paragraph with ',
          },
          {
            text: 'bold text',
            bold: true,
          },
          {
            text: ' and ',
          },
          {
            text: 'italic text',
            italic: true,
          },
          {
            text: '.',
          },
          {
            text: 'hilight',
            highlight: true,
          },
        ],
        id: 'ClqektybwP',
      },
      {
        type: 'p',
        children: [
          {
            text: 'The end',
          },
        ],
      },
    ];
    const markdown = await platejsToMarkdown(editor, elements);
    const elementsFromMarkdown = await markdownToPlatejs(editor, markdown);

    // recursively remove all ids from both expected and actual elements before comparing

    const expectedWithoutIds = stripIds(elements);
    const actualWithoutIds = stripIds(elementsFromMarkdown);

    expect(actualWithoutIds).toEqual(expectedWithoutIds);
  });

  it('should conver a list', async () => {
    const elements: Value = [
      {
        type: 'p',
        children: [
          {
            text: '',
            highlight: true,
          },
        ],
        id: 'ClqektybwP',
      },
      {
        type: 'h2',
        children: [
          {
            text: 'Features',
          },
        ],
        id: 'eVbnpcBwkp',
      },
      {
        type: 'p',
        id: 'FbIatZBASm',
        children: [
          {
            text: 'Feature rich',
          },
        ],
        indent: 1,
        listStyleType: 'disc',
      },
      {
        type: 'p',
        id: '3p3BUsPf7T',
        indent: 1,
        listStyleType: 'disc',
        children: [
          {
            text: 'Very cool',
          },
        ],
      },
      {
        type: 'p',
        id: 'zaPCCuMpTZ',
        indent: 1,
        listStyleType: 'disc',
        children: [
          {
            text: 'Nice test',
          },
        ],
      },
      {
        children: [
          {
            text: '',
          },
        ],
        type: 'p',
        id: 'hjDTOHWM9j',
      },
    ];
    const markdown = await platejsToMarkdown(editor, elements);
    const platejs = await markdownToPlatejs(editor, markdown);
    const expectedWithoutIds = stripIds(elements);
    const actualWithoutIds = stripIds(platejs);
    expect(actualWithoutIds).toEqual(expectedWithoutIds);
  });
});

describe('toggle serializer', () => {
  it('should serialize a toggle', async () => {
    const markdown = `<details>
<summary>Toggle</summary>


Nested

​

</details>`;
    const platejs = await markdownToPlatejs(editor, markdown);
    expect(platejs).toBeDefined();
    expect(platejs[0].type).toBe('toggle');
    expect(platejs[0].children[0].text).toBe('Toggle');
    expect(platejs[1].type).toBe('p');
    expect(platejs[1].children[0].text).toBe('Nested');
  });
});

describe('metric escaping bug tests', () => {
  it('should not add backslashes to metric tags during multiple conversions', async () => {
    const originalMarkdown = `# Sales Report

Our top performer this month shows impressive results.

<metric metricId="abc-123-def" width="100%" caption="Sales Performance"></metric>

## Summary
Great performance across all metrics.`;

    // First conversion cycle: markdown -> platejs -> markdown
    const platejs = await markdownToPlatejs(editor, originalMarkdown);
    const convertedMarkdown = await platejsToMarkdown(editor, platejs);

    // Second conversion cycle: markdown -> platejs -> markdown (simulates save operation)
    const platejs2 = await markdownToPlatejs(editor, convertedMarkdown);
    const convertedMarkdown2 = await platejsToMarkdown(editor, platejs2);

    // Third conversion cycle (simulates another save operation)
    const platejs3 = await markdownToPlatejs(editor, convertedMarkdown2);
    const convertedMarkdown3 = await platejsToMarkdown(editor, platejs3);

    // Should not contain escaped metric tags
    expect(convertedMarkdown3).not.toContain('\\<metric');
    expect(convertedMarkdown3).not.toContain('\\<\\/metric');
    expect(convertedMarkdown3).toContain('<metric metricId="abc-123-def"');
    expect(convertedMarkdown3).toContain('</metric>');

    // Verify the metric element is still properly parsed
    const finalPlatejs = await markdownToPlatejs(editor, convertedMarkdown3);
    const metricElement = finalPlatejs.find((el) => el.type === 'metric');
    expect(metricElement).toBeDefined();
    expect(metricElement?.metricId).toBe('abc-123-def');
  });

  it('should handle metric tags with special characters in attributes', async () => {
    const markdown = `<metric metricId="test-123-with-&-special-chars" caption="Revenue & Profit Analysis" width="100%"></metric>`;

    // Multiple conversion cycles
    const platejs = await markdownToPlatejs(editor, markdown);
    const convertedMarkdown = await platejsToMarkdown(editor, platejs);
    const platejs2 = await markdownToPlatejs(editor, convertedMarkdown);
    const convertedMarkdown2 = await platejsToMarkdown(editor, platejs2);

    // Should not escape the metric tags themselves
    expect(convertedMarkdown2).not.toContain('\\<metric');
    expect(convertedMarkdown2).toContain('<metric metricId="test-123-with-&-special-chars"');
  });

  it('should handle multiple metric tags in a single document', async () => {
    const markdown = `# Multi-Metric Report

<metric metricId="first-metric" caption="First Metric"></metric>

Some content between metrics.

<metric metricId="second-metric" width="50%" caption="Second Metric"></metric>

More content.

<metric metricId="third-metric" versionNumber="1.2" caption="Third Metric"></metric>`;

    // Simulate multiple save operations
    let currentMarkdown = markdown;

    for (let i = 0; i < 5; i++) {
      const platejs = await markdownToPlatejs(editor, currentMarkdown);
      currentMarkdown = await platejsToMarkdown(editor, platejs);
    }

    // None of the metrics should be escaped
    expect(currentMarkdown).not.toContain('\\<metric');
    expect(currentMarkdown).not.toContain('\\</metric>');

    // All metrics should still be present
    expect(currentMarkdown).toContain('<metric metricId="first-metric"');
    expect(currentMarkdown).toContain('<metric metricId="second-metric"');
    expect(currentMarkdown).toContain('<metric metricId="third-metric"');

    // Final conversion should still work
    const finalPlatejs = await markdownToPlatejs(editor, currentMarkdown);
    const metricElements = finalPlatejs.filter((el) => el.type === 'metric');
    expect(metricElements).toHaveLength(3);
  });

  it('should preserve metric functionality after content edits and saves', async () => {
    // Simulate the workflow: create report -> edit -> save -> edit -> save
    const initialMarkdown = `# Initial Report

<metric metricId="initial-metric" caption="Initial Metric"></metric>`;

    // First save cycle
    const platejs1 = await markdownToPlatejs(editor, initialMarkdown);
    const savedMarkdown1 = await platejsToMarkdown(editor, platejs1);

    // Edit: add content
    const editedMarkdown = savedMarkdown1 + `\n\n## New Section\nAdded content after save.`;

    // Second save cycle
    const platejs2 = await markdownToPlatejs(editor, editedMarkdown);
    const savedMarkdown2 = await platejsToMarkdown(editor, platejs2);

    // Edit: add another metric
    const editedMarkdown2 = savedMarkdown2.replace(
      '## New Section',
      `<metric metricId="added-metric" caption="Added Later"></metric>\n\n## New Section`
    );

    // Third save cycle
    const platejs3 = await markdownToPlatejs(editor, editedMarkdown2);
    const savedMarkdown3 = await platejsToMarkdown(editor, platejs3);

    // Neither metric should be escaped
    expect(savedMarkdown3).not.toContain('\\<metric');
    expect(savedMarkdown3).toContain('<metric metricId="initial-metric"');
    expect(savedMarkdown3).toContain('<metric metricId="added-metric"');

    // Both metrics should parse correctly
    const finalPlatejs = await markdownToPlatejs(editor, savedMarkdown3);
    const metrics = finalPlatejs.filter((el) => el.type === 'metric');
    expect(metrics).toHaveLength(2);
    expect(metrics[0].metricId).toBe('initial-metric');
    expect(metrics[1].metricId).toBe('added-metric');
  });

  // Edge cases that might trigger the escaping bug
  it('should handle metric tags when markdown processor sees angle brackets as special', async () => {
    // This test specifically targets potential escaping during markdown processing
    const markdown = `# Test Report

Text before metric.

<metric metricId="edge-case-test" caption="Test < and > in caption"></metric>

Text after metric.`;

    // Process through multiple serialization cycles to trigger any escaping behavior
    let result = markdown;
    for (let cycle = 0; cycle < 10; cycle++) {
      const platejs = await markdownToPlatejs(editor, result);
      result = await platejsToMarkdown(editor, platejs);

      // After each cycle, metric tags should never be escaped
      expect(result).not.toContain('\\<metric');
      expect(result).not.toContain('\\</metric>');
      expect(result).toContain('<metric metricId="edge-case-test"');
    }
  });

  it('should handle metric tags when content contains backslashes already', async () => {
    const markdown = `# Report with Existing Backslashes

This is \\*escaped\\* markdown text.

<metric metricId="backslash-test" caption="Test Metric"></metric>

Some code: \`console.log("test\\n");\`

Another escaped: \\<div\\>content\\</div\\>`;

    // Process multiple times to see if existing backslashes interfere
    let result = markdown;
    for (let i = 0; i < 3; i++) {
      const platejs = await markdownToPlatejs(editor, result);
      result = await platejsToMarkdown(editor, platejs);
      console.log(i, result);
    }

    // Metric should not be escaped
    expect(result).not.toContain('\\<metric');
    expect(result).toContain('<metric metricId="backslash-test"');

    // Existing escaped content should remain
    expect(result).toContain('\\*escaped\\*');
    expect(result).toContain('<div>');
  });

  it('should reproduce the reported bug scenario: works initially but breaks after saves', async () => {
    // Initial report creation - this should work fine
    const initialContent = `# Sales Performance Report

<metric metricId="sales-overview" caption="Q4 Sales Overview"></metric>

## Analysis
The data shows strong performance this quarter.`;

    // Simulate initial save (first conversion)
    const initialPlatejs = await markdownToPlatejs(editor, initialContent);
    expect(initialPlatejs.find((el) => el.type === 'metric')).toBeDefined();

    const firstSave = await platejsToMarkdown(editor, initialPlatejs);
    expect(firstSave).toContain('<metric metricId="sales-overview"');
    expect(firstSave).not.toContain('\\<metric');

    // Simulate user editing and additional saves
    let currentContent = firstSave;

    // Multiple edit/save cycles (this is where the bug reportedly occurs)
    for (let saveCount = 1; saveCount <= 10; saveCount++) {
      // Convert to editor format
      const platejs = await markdownToPlatejs(editor, currentContent);

      // Simulate user adding some content (like what happens during editing)
      platejs.push({
        type: 'p',
        children: [{ text: `Edit from save cycle ${saveCount}` }],
      });

      // Save back to markdown
      currentContent = await platejsToMarkdown(editor, platejs);

      // At NO point should the metric tag be escaped
      expect(currentContent).not.toContain('\\<metric');
      expect(currentContent).not.toContain('\\</metric>');
      expect(currentContent).toContain('<metric metricId="sales-overview"');

      // The metric should still be parseable
      const testPlatejs = await markdownToPlatejs(editor, currentContent);
      const metricEl = testPlatejs.find((el) => el.type === 'metric');
      expect(metricEl).toBeDefined();
      expect(metricEl?.metricId).toBe('sales-overview');
    }
  });

  it('should handle JSON serialization scenarios that might escape content', async () => {
    // This test targets potential escaping during JSON serialization/deserialization
    // which might happen when content is sent to/from the server
    const markdown = `# Report with JSON-Sensitive Content

<metric metricId="json-test-metric" versionNumber="" width="100%" caption='Caption with "quotes" and special chars'></metric>

Text with "quotes" and 'apostrophes'.`;

    // Simulate JSON serialization/deserialization that might happen during API calls
    const platejs = await markdownToPlatejs(editor, markdown);
    const serializedPlateJS = JSON.parse(JSON.stringify(platejs));
    const backToMarkdown = await platejsToMarkdown(editor, serializedPlateJS);
    console.log('backToMarkdown', backToMarkdown);
    expect(backToMarkdown).not.toContain('\\<metric');
    expect(backToMarkdown).toContain('<metric metricId="json-test-metric"');

    // Convert back to PlateJS again (simulating another round trip)
    const platejs2 = await markdownToPlatejs(editor, backToMarkdown);
    const serializedPlateJS2 = JSON.parse(JSON.stringify(platejs2));
    const finalMarkdown = await platejsToMarkdown(editor, serializedPlateJS2);

    console.log('finalMarkdown', finalMarkdown);

    // Metric tags should never be escaped during JSON round trips
    expect(finalMarkdown).not.toContain('\\<metric');
    expect(finalMarkdown).toContain('<metric metricId="json-test-metric"');
    expect(finalMarkdown).toContain(`caption="Caption with &quot;quotes&quot; and special chars"`);
  });

  it('should handle streaming content updates without escaping metrics', async () => {
    // This simulates the streaming content updates that happen during report generation
    const baseMarkdown = `# Streaming Report

Initial content.`;

    const streamedAddition = `

<metric metricId="streamed-metric" caption="Added During Stream"></metric>

More streamed content.`;

    // Simulate initial content
    let platejs = await markdownToPlatejs(editor, baseMarkdown);

    // Simulate streaming addition (like what happens during AI content generation)
    const streamedPlatejs = await markdownToPlatejs(editor, streamedAddition);
    platejs = platejs.concat(streamedPlatejs);

    // Convert back to markdown (simulating save)
    const result = await platejsToMarkdown(editor, platejs);

    // Multiple conversion cycles to simulate additional streaming and saves
    let currentContent = result;
    for (let i = 0; i < 5; i++) {
      const tempPlatejs = await markdownToPlatejs(editor, currentContent);
      // Add more streamed content
      tempPlatejs.push({
        type: 'p',
        children: [{ text: `Stream update ${i}` }],
      });
      currentContent = await platejsToMarkdown(editor, tempPlatejs);
    }

    // Metric should not be escaped during streaming operations
    expect(currentContent).not.toContain('\\<metric');
    expect(currentContent).toContain('<metric metricId="streamed-metric"');
  });
});
