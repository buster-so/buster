import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@/components/ui/buttons';
import { Checkbox } from '../../checkbox';
import { Switch } from '../../switch/Switch';
import { AppMarkdown } from './AppMarkdown';

const meta: Meta<typeof AppMarkdown> = {
  title: 'UI/Typography/AppMarkdown',
  component: AppMarkdown,
  argTypes: {
    markdown: {
      control: 'text',
      description: 'The markdown content to render'
    },
    showLoader: {
      control: 'boolean',
      description: 'Whether to show a loader'
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names'
    },
    stripFormatting: {
      control: 'boolean',
      description: 'Whether to strip formatting'
    }
  }
};

export default meta;
type Story = StoryObj<typeof AppMarkdown>;

export const Basic: Story = {
  args: {
    markdown: '# Hello World\n\nThis is a basic markdown example.'
  }
};

export const WithHeadings: Story = {
  args: {
    markdown: `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

Regular paragraph text.`
  }
};

export const WithFormatting: Story = {
  args: {
    markdown: `# Text Formatting

**Bold text** and *italic text* and ~~strikethrough~~.

Combined **bold and _italic_** formatting.

\`Inline code\` with backticks.`
  }
};

export const WithLists: Story = {
  args: {
    markdown: `# Lists

## Unordered List
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3

## Ordered List
1. First item
2. Second item
   1. Nested item 2.1
   2. Nested item 2.2
3. Third item`
  }
};

export const WithCodeBlocks: Story = {
  args: {
    markdown: `# Code Blocks

\`\`\`javascript
function helloWorld() {
  console.wow('Hello, world!');
}
\`\`\`

\`\`\`css
.container {
  display: flex;
  justify-content: center;
}
\`\`\`

\`\`\`jsx
import React from 'react';

const Component = () => {
  return <div>Hello World</div>;
};
\`\`\``
  }
};

export const WithBlockquotes: Story = {
  args: {
    markdown: `# Blockquotes

> This is a blockquote
> 
> It can span multiple lines

> Nested blockquotes
> > Like this one`
  }
};

export const WithTables: Story = {
  args: {
    markdown: `# Tables

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
| Cell 7   | Cell 8   | Cell 9   |`
  }
};

export const WithLinks: Story = {
  args: {
    markdown: `# Links

[Link to Google](https://www.google.com)

[Link with title](https://www.example.com "Example Website")

Automatic link: <https://www.example.com>`
  }
};

export const ComplexExample: Story = {
  args: {
    markdown: `# Markdown Documentation

## Introduction

This is a **comprehensive** example of markdown rendering capabilities.

## Features

### Text Formatting

You can make text **bold**, *italic*, or ~~strikethrough~~.

### Lists

Unordered list:
- Item 1
- Item 2
  - Nested item
- Item 3

Ordered list:
1. First step
2. Second step
   1. Sub-step
   2. Another sub-step
3. Final step

### Code

Inline \`code\` and code blocks:

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): User {
  // Implementation
  return { id, name: 'John Doe', email: 'john@example.com' };
}
\`\`\`

### Blockquotes

> Important information or quotes can be highlighted using blockquotes.
> 
> They can span multiple paragraphs.

### Tables

| Feature | Support | Notes |
|---------|---------|-------|
| Tables  | ✅      | With alignment |
| Lists   | ✅      | Nested support |
| Code    | ✅      | Syntax highlighting |

### Links

[Visit our website](https://example.com) for more information.`
  }
};

export const WithCustomClass: Story = {
  args: {
    markdown: '# Custom Styled Markdown\n\nThis example has a custom class applied.',
    className: 'bg-gray-100 p-4 rounded-md'
  }
};

const randomMarkdownContent = [
  '# New Section\n\nThis is a new section with some content.',
  '## Subheading\n\nHere is a paragraph with **bold** and *italic* text.',
  '### Smaller Heading\n\n- List item 1\n- List item 2\n- List item 3',
  '#### Tiny Heading\n\n> This is a blockquote with some important information.',
  '##### Micro Heading\n\n1. Numbered item 1\n2. Numbered item 2',
  '###### Nano Heading\n\n`code example` and more text here.',
  // '## Table Example\n\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |',
  '### Mixed Content\n\nHere is some text with [a link](https://example.com) and `inline code`.'
];

const InteractiveMarkdown = () => {
  const [markdown, setMarkdown] = useState(
    '# Interactive Markdown\n\nClick the button to add more content!'
  );
  const [stripFormatting, setStripFormatting] = useState(false);

  const addRandomContent = () => {
    const randomContent =
      randomMarkdownContent[Math.floor(Math.random() * randomMarkdownContent.length)];
    setMarkdown((prev) => `${prev}\n\n${randomContent}`);
  };

  return (
    <div className="space-y-4">
      <Button onClick={addRandomContent}>Add Random Content</Button>

      <div className="flex items-center gap-2">
        <span>Strip Formatting</span>
        <Switch checked={stripFormatting} onCheckedChange={setStripFormatting}></Switch>
      </div>
      <AppMarkdown markdown={markdown} showLoader stripFormatting={stripFormatting} />
    </div>
  );
};

export const WithLoader: Story = {
  render: () => <InteractiveMarkdown />
};

export const WithProblematicReasoningMarkdown2: Story = {
  args: {
    markdown: `**Thought**:
The user wants to save the existing "Monthly Sales by Sales Rep" chart into a dashboard and add a selection of key sales visualizations to give a comprehensive view of performance. I'll assemble about nine additional metrics covering overall trends, order metrics, product and territory breakdowns, growth rates, and quota comparisons, all over the last 12 months. Then I'll create a dashboard titled "Sales Performance Dashboard" and add all visualizations.

**Step-by-Step Plan**:
1. **Create 9 Visualizations**:
- **Title:** Total Sales (Last 12 Months)
  - **Type:** Number Card
  - **Datasets:** sales_order_header, sales_order_detail
  - **Expected Output:** A single-value card showing the sum of all sales amounts over the past 12 months, formatted as currency.

- **Title:** Monthly Total Sales Trend (Last 12 Months)
  - **Type:** Line Chart
  - **Datasets:** sales_order_header, sales_order_detail
  - **Expected Output:** A line chart with the last 12 months on the x-axis and total sales amount on the y-axis.

- **Title:** Monthly Number of Orders (Last 12 Months)
  - **Type:** Line Chart
  - **Datasets:** sales_order_header
  - **Expected Output:** A line chart with months on the x-axis and count of orders on the y-axis.

- **Title:** Average Order Value (Last 12 Months)
  - **Type:** Line Chart
  - **Datasets:** sales_order_header, sales_order_detail
  - **Expected Output:** A line chart showing month on the x-axis and average order value (sales amount divided by number of orders) on the y-axis.

- **Title:** Top 10 Products by Revenue (Last 12 Months)
  - **Type:** Bar Chart
  - **Datasets:** sales_order_header, sales_order_detail, product
  - **Expected Output:** A bar chart listing the top 10 products by total revenue, with product names on the x-axis and revenue on the y-axis.

- **Title:** Sales by Region (Last 12 Months)
  - **Type:** Bar Chart
  - **Datasets:** sales_order_header, sales_territory
  - **Expected Output:** A bar chart with regions on the x-axis and total sales amount on the y-axis.

- **Title:** Month-over-Month Sales Growth Rate (Last 12 Months)
  - **Type:** Line Chart
  - **Datasets:** monthly_sales_growth_rate
  - **Expected Output:** A line chart with months on the x-axis and month-over-month percentage growth on the y-axis.

- **Title:** Sales vs Quota by Sales Rep (Last 12 Months)
  - **Type:** Combo Chart
  - **Datasets:** sales_order_header, sales_order_detail, sales_person_quota_history, sales_person, person
  - **Expected Output:** A chart with sales reps on the x-axis showing two series: total sales (bars) vs quota (line) for each rep over the last 12 months.

- **Title:** Sales by Product Category (Last 12 Months)
  - **Type:** Stacked Bar Chart
  - **Datasets:** sales_order_header, sales_order_detail, product, product_subcategory
  - **Expected Output:** A stacked bar chart with product categories on the x-axis and total sales on the y-axis, segmented by subcategory.

2. **Create Dashboard**:
- **Title:** Sales Performance Dashboard
- Add the existing "Monthly Sales by Sales Rep (Last 12 Months)" metric plus the nine newly created visualizations.

3. **Review & Finish**:
- Confirm all charts show data for the last 12 months, use names instead of IDs, and display correctly without empty results.

**Notes**:
- Timeframe defaults to the last 12 months for all metrics.
- Product and region names will be displayed instead of IDs.
- Top-product chart limits to the top 10 by revenue.`
  }
};
