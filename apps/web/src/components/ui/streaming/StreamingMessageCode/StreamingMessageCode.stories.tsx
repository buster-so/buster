'use client';

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import type { FileType } from '@/api/asset_interfaces';
import { Button } from '@/components/ui/buttons';
import { StreamingMessageCode } from './StreamingMessageCode';

const meta: Meta<typeof StreamingMessageCode> = {
  title: 'UI/streaming/StreamingMessageCode',
  component: StreamingMessageCode,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof StreamingMessageCode>;

const sampleYaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
  namespace: production
  labels:
    app: my-application
    environment: production
    team: platform
  annotations:
    description: "Production configuration for my-application"
    lastModified: "2024-03-20"
    version: "1.0.0"
data:
  # Database Configuration
  database:
    host: db.example.com
    port: "5432"
    name: production_db
    max_connections: "100"
    idle_timeout: "300"
    connection_timeout: "30"

  # Cache Configuration
  redis:
    host: redis.example.com
    port: "6379"
    max_memory: "2gb"
    eviction_policy: "allkeys-lru"
    databases: "16"

  # Application Settings
  app_settings:
    log_level: "INFO"
    debug_mode: "false"
    max_threads: "50"
    worker_processes: "4"
    request_timeout: "30s"
    session_timeout: "24h"

  # Feature Flags
  features:
    enable_new_ui: "true"
    enable_analytics: "true"
    enable_caching: "true"
    enable_rate_limiting: "true"
    beta_features: "false"

  # API Configuration
  api:
    version: "v2"
    base_url: "https://api.example.com"
    rate_limit: "1000"
    timeout: "5s"
    retry_attempts: "3"
    retry_delay: "1s"


`;

const baseProps = {
  file_name: 'config.yaml',
  version_number: 1,
  file_type: 'reasoning' as FileType,
  version_id: '123'
};

export const Default: Story = {
  args: {
    ...baseProps,
    status: 'completed',
    isCompletedStream: true,
    file: {
      text: sampleYaml,
      modified: []
    }
  }
};

export const WithHiddenLines: Story = {
  args: {
    ...baseProps,
    status: 'completed',
    isCompletedStream: true,
    file: {
      text: sampleYaml,
      modified: [[2, 4]] // This will hide lines 2-4
    }
  }
};

export const Loading: Story = {
  args: {
    ...baseProps,
    status: 'loading',
    isCompletedStream: false,
    file: {
      text: sampleYaml,
      modified: []
    }
  }
};

export const WithButtons: Story = {
  args: {
    ...baseProps,
    status: 'completed',
    isCompletedStream: true,
    file: {
      text: sampleYaml,
      modified: []
    },
    buttons: (
      <div className="flex gap-2">
        <button className="rounded bg-blue-500 px-3 py-1 text-white">Action 1</button>
        <button className="rounded bg-green-500 px-3 py-1 text-white">Action 2</button>
      </div>
    )
  }
};

// Interactive story with streaming content
const streamingContent = [
  'apiVersion: v1',
  'kind: ConfigMap',
  'metadata:',
  '  name: my-config',
  'data:',
  '  key1: value1',
  '  key2: value2'
];

export const InteractiveStreaming: Story = {
  args: {
    ...baseProps,
    status: 'completed',
    isCompletedStream: false,
    file: {
      text: streamingContent.slice(0, 3).join('\n'),
      modified: []
    }
  },
  render: (args) => {
    const [currentLines, setCurrentLines] = React.useState(3);
    const [isStreaming, setIsStreaming] = React.useState(false);

    const handleStreamClick = () => {
      setIsStreaming(true);
      const interval = setInterval(() => {
        setCurrentLines((prev) => {
          if (prev >= streamingContent.length) {
            clearInterval(interval);
            setIsStreaming(false);
            return prev;
          }
          return prev + 1;
        });
      }, 50);
    };

    return (
      <div className="space-y-4">
        <StreamingMessageCode
          {...args}
          isCompletedStream={!isStreaming}
          file={{
            text: streamingContent.slice(0, currentLines).join('\n'),
            modified: []
          }}
        />
        <div className="flex justify-center">
          <Button
            onClick={handleStreamClick}
            disabled={isStreaming || currentLines >= streamingContent.length}>
            {isStreaming ? 'Streaming...' : 'Start Streaming'}
          </Button>
        </div>
      </div>
    );
  }
};
