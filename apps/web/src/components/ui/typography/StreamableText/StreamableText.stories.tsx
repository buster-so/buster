import type { Meta, StoryObj } from '@storybook/react';
import { StreamableText, type StreamableTextProps } from './StreamableText';
import { useStreamExample } from '@llm-ui/react';
import { useState } from 'react';
import { fn } from '@storybook/test';

const meta: Meta<typeof StreamableText> = {
  title: 'UI/typography/StreamableText',
  component: StreamableText,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: 'The text content to stream and display'
    },
    isStreamFinished: {
      control: 'boolean',
      description: 'Whether to show a loading indicator'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const example = `## Python

\`\`\`python
print('Hello llm-ui!')
\`\`\`

## Typescript

\`\`\`typescript
console.log('Hello llm-ui!');
\`\`\`
<<<<<<< HEAD

## YAML

\`\`\`yaml
name: Buster
version: 1.0.0
test:
  - item1
  - item2
    - item3:
      - item4
      - item5

\`\`\`

## JSON
=======
>>>>>>> staging
`;

const randomMarkdownBlocks = [
  `## Database Query Example

\`\`\`sql
SELECT users.name, COUNT(orders.id) as order_count
FROM users
LEFT JOIN orders ON users.id = orders.user_id
WHERE users.created_at > '2023-01-01'
GROUP BY users.id, users.name
ORDER BY order_count DESC;
\`\`\`

This query demonstrates how to join tables and aggregate data effectively.`,

  `## React Component Pattern

\`\`\`jsx
const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(userData => {
      setUser(userData);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};
\`\`\`

**Key Features:**
- State management with hooks
- Loading states
- Clean component structure`,

  `## Advanced Python Data Processing

\`\`\`python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def process_sales_data(df):
    # Clean and transform the data
    df['date'] = pd.to_datetime(df['date'])
    df['revenue'] = df['quantity'] * df['price']
    
    # Calculate rolling averages
    df['7_day_avg'] = df['revenue'].rolling(window=7).mean()
    df['30_day_avg'] = df['revenue'].rolling(window=30).mean()
    
    # Identify trends
    df['trend'] = np.where(
        df['7_day_avg'] > df['30_day_avg'], 
        'Increasing', 
        'Decreasing'
    )
    
    return df

# Example usage
sales_df = pd.read_csv('sales_data.csv')
processed_data = process_sales_data(sales_df)
\`\`\`

> **Note:** This example shows advanced data manipulation techniques using pandas and numpy.`,

  `## API Design Best Practices

### RESTful Endpoints

\`\`\`typescript
// GET /api/users - List all users
// GET /api/users/:id - Get specific user
// POST /api/users - Create new user
// PUT /api/users/:id - Update user
// DELETE /api/users/:id - Delete user

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

class UserController {
  async getUsers(): Promise<User[]> {
    return await this.userService.findAll();
  }
  
  async getUser(id: string): Promise<User | null> {
    return await this.userService.findById(id);
  }
  
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return await this.userService.create(userData);
  }
}
\`\`\`

### Error Handling
- Always return consistent error formats
- Use appropriate HTTP status codes
- Provide meaningful error messages`,

  `## Docker Configuration

\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
\`\`\`

**Multi-stage build optimization:**

\`\`\`dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
CMD ["npm", "start"]
\`\`\``
];

export const Default: Story = {
  args: {
    message: example,
    isStreamFinished: false
  },
  render: (args) => {
<<<<<<< HEAD
    const [currentMessage, setCurrentMessage] = useState(
      args.message + randomMarkdownBlocks.join('\n\n---\n\n')
    );

    const { output, isStreamFinished, start } = useStreamExample(currentMessage, {
      autoStart: true,
      autoStartDelayMs: 0,
      startIndex: 0,
      delayMultiplier: 0.075
    });
=======
    const [currentMessage, setCurrentMessage] = useState(args.message);
>>>>>>> staging

    const addRandomMarkdown = fn(() => {
      const randomBlock =
        randomMarkdownBlocks[Math.floor(Math.random() * randomMarkdownBlocks.length)];
      setCurrentMessage((prev: string) => prev + '\n\n---\n\n' + randomBlock);
<<<<<<< HEAD
      setTimeout(() => {
        start();
      }, 1);
=======
>>>>>>> staging
    });

    return (
      <div style={{ maxWidth: '800px', padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={addRandomMarkdown}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}>
            Add Random Markdown Block
          </button>
        </div>
<<<<<<< HEAD

        <StreamableText message={output} isStreamFinished={isStreamFinished} />
=======
        <StreamableText message={currentMessage} isStreamFinished={args.isStreamFinished} />
>>>>>>> staging
      </div>
    );
  }
};
