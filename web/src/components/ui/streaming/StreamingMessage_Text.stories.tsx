'use client';

import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { Button } from '../buttons/Button';
import { StreamingMessage_Text } from './StreamingMessage_Text';

const meta: Meta<typeof StreamingMessage_Text> = {
  title: 'UI/Streaming/StreamingMessage_Text',
  component: StreamingMessage_Text,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof StreamingMessage_Text>;

export const Default: Story = {
  args: {
    message: 'This is a sample streaming message.',
    isCompletedStream: true
  }
};

export const Loading: Story = {
  args: {
    message: 'This message is still streaming...',
    isCompletedStream: false
  }
};

export const SuperLongWithNewLines: Story = {
  args: {
    message: Array.from({ length: 100 })
      .map((_, index) => {
        if (index > 0 && index % 8 === 0) {
          return `\n${faker.lorem.word()}`;
        }
        return faker.lorem.word();
      })
      .join(' '),
    isCompletedStream: true
  }
};

// Interactive story with a button to simulate streaming
const InteractiveStreamingMessage = () => {
  const [message, setMessage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetter, setResetter] = useState(0);

  const handleStream = async () => {
    setIsLoading(true);
    setIsCompleted(false);
    setMessage('');

    const sampleText = faker.lorem.paragraph({ min: 3, max: 6 });
    const words = sampleText.split(' ');
    let currentText = message;

    for (const word of words) {
      currentText += (currentText ? ' ' : '') + word;
      setMessage(currentText);
      await new Promise((resolve) => setTimeout(resolve, 5)); // Increased delay for word-by-word streaming
    }

    setIsCompleted(true);
    setIsLoading(false);
  };

  return (
    <div className="max-w-[350px] min-w-[350px] space-y-4">
      <div className="flex space-x-2">
        <Button onClick={handleStream}>{isLoading ? 'Streaming...' : 'Start Streaming'}</Button>
        <Button
          onClick={() => {
            setResetter((prev) => prev + 1);
            setMessage('');
          }}>
          Reset
        </Button>
      </div>
      <div className="rounded border p-4" key={resetter}>
        <StreamingMessage_Text message={message} isCompletedStream={false} />
      </div>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveStreamingMessage />
};
