import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAutoScroll } from './useAutoScroll';

interface Message {
  id: number;
  text: string;
  timestamp: string;
}

const AutoScrollDemo = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAutoAddEnabled, setIsAutoAddEnabled] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const { isAutoScrollEnabled, scrollToBottom, scrollToTop, enableAutoScroll, disableAutoScroll } =
    useAutoScroll(containerRef, { enabled, observeSubTree: true });

  const addMessage = () => {
    const newMessage: Message = {
      id: messages.length + 1 + faker.number.int({ min: 1, max: 1000000 }),
      text: `Message ${messages.length + 1}: ${Lorem.generateSentences(1)}`,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const addManyMessages = () => {
    const newMessages: Message[] = Array.from({ length: 10 }, (_, i) => ({
      id: messages.length + i + 1,
      text: `Message ${messages.length + i + 1}: ${Lorem.generateSentences(1)}`,
      timestamp: new Date().toLocaleTimeString()
    }));
    setMessages((prev) => [...prev, ...newMessages]);
  };

  const toggleAutoAdd = useCallback(() => {
    if (isAutoAddEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      setIsAutoAddEnabled(false);
    } else {
      intervalRef.current = setInterval(addMessage, 1000);
      setIsAutoAddEnabled(true);
    }
  }, [isAutoAddEnabled]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex w-[600px] flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={addMessage}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Add Message
        </button>
        <button
          type="button"
          onClick={addManyMessages}
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600">
          Add 10 Messages
        </button>
        <button
          type="button"
          onClick={toggleAutoAdd}
          className={`rounded px-4 py-2 text-white ${
            isAutoAddEnabled
              ? 'bg-purple-500 hover:bg-purple-600'
              : 'bg-purple-400 hover:bg-purple-500'
          }`}>
          Auto Add {isAutoAddEnabled ? 'ON' : 'OFF'}
        </button>
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`rounded px-4 py-2 text-white ${
            enabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
          }`}>
          Enabled {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">Auto-scroll:</span>
          <button
            type="button"
            onClick={isAutoScrollEnabled ? disableAutoScroll : enableAutoScroll}
            className={`rounded px-3 py-1 text-white ${
              isAutoScrollEnabled ? 'bg-green-500' : 'bg-red-500'
            }`}>
            {isAutoScrollEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollToTop()}
            className="rounded bg-gray-500 px-3 py-1 text-white hover:bg-gray-600">
            Scroll to Top (smooth)
          </button>
          <button
            type="button"
            onClick={() => scrollToTop()}
            className="rounded bg-gray-500 px-3 py-1 text-white hover:bg-gray-600">
            Scroll to Top (instant)
          </button>
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="rounded bg-gray-500 px-3 py-1 text-white hover:bg-gray-600">
            Scroll to Bottom (smooth)
          </button>
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="rounded bg-gray-500 px-3 py-1 text-white hover:bg-gray-600">
            Scroll to Bottom (instant)
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[400px] space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-4">
        {messages.map((message) => (
          <div key={message.id} className="rounded-lg bg-gray-100 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-semibold">Message #{message.id}</span>
              <span className="text-xs text-gray-500">{message.timestamp}</span>
            </div>
            <p className="text-sm">{message.text}</p>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center text-gray-500">
            No messages. Click "Add Message" to start.
          </div>
        )}
      </div>
    </div>
  );
};

// Lorem ipsum generator for demo purposes
const Lorem = {
  words: [
    'lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'consectetur',
    'adipiscing',
    'elit',
    'sed',
    'do',
    'eiusmod',
    'tempor',
    'incididunt',
    'ut',
    'labore',
    'et',
    'dolore',
    'magna',
    'aliqua'
  ],
  generateSentences: (count: number) => {
    const sentences = [];
    for (let i = 0; i < count; i++) {
      const wordCount = Math.floor(Math.random() * 10) + 5;
      const words = Array.from(
        { length: wordCount },
        () => Lorem.words[Math.floor(Math.random() * Lorem.words.length)]
      );
      sentences.push(`${words.join(' ')}.`);
    }
    return sentences.join(' ');
  }
};

const meta: Meta<typeof AutoScrollDemo> = {
  title: 'Hooks/useAutoScroll',
  component: AutoScrollDemo,
  parameters: {
    layout: 'centered'
  }
};

export default meta;
type Story = StoryObj<typeof AutoScrollDemo>;

export const Default: Story = {};

export const ScrollAreaComponentWithAutoScroll: Story = {
  render: () => {
    const generateCard = (index: number) => ({
      id: index,
      title: `${faker.company.name()} ${index}`,
      color: faker.color.rgb(),
      sentences: faker.lorem.sentences(2)
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const [cards, setCards] = useState(() =>
      Array.from({ length: 9 }, (_, i) => generateCard(i + 1))
    );
    const [isAutoAddEnabled, setIsAutoAddEnabled] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout>();
    const {
      isAutoScrollEnabled,
      scrollToBottom,
      scrollToTop,
      enableAutoScroll,
      disableAutoScroll
    } = useAutoScroll(containerRef, {});

    const addCard = useCallback(() => {
      setCards((prev) => [...prev, generateCard(prev.length + 1)]);
    }, []);

    const toggleAutoAdd = useCallback(() => {
      if (isAutoAddEnabled) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
        }
        setIsAutoAddEnabled(false);
      } else {
        intervalRef.current = setInterval(addCard, 1000);
        setIsAutoAddEnabled(true);
        enableAutoScroll(); // Enable auto-scroll when auto-adding cards
      }
    }, [isAutoAddEnabled, addCard, enableAutoScroll]);

    // Cleanup interval on unmount
    useEffect(() => {
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, []);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Scrollable Grid Layout</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addCard}
              className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600">
              Add Card
            </button>
            <button
              type="button"
              onClick={toggleAutoAdd}
              className={`rounded px-3 py-1 text-sm text-white ${
                isAutoAddEnabled
                  ? 'bg-purple-500 hover:bg-purple-600'
                  : 'bg-purple-400 hover:bg-purple-500'
              }`}>
              Auto Add {isAutoAddEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={isAutoScrollEnabled ? disableAutoScroll : enableAutoScroll}
              className={`rounded px-3 py-1 text-sm text-white ${
                isAutoScrollEnabled
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}>
              Auto-scroll {isAutoScrollEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={() => scrollToTop()}
              className="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600">
              To Top
            </button>
            <button
              type="button"
              onClick={() => scrollToBottom()}
              className="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600">
              To Bottom
            </button>
          </div>
        </div>
        <ScrollArea
          viewportRef={containerRef}
          className="h-[600px] w-[800px] rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex flex-col rounded-lg p-4 shadow-sm transition-all hover:shadow-md"
                style={{ backgroundColor: card.color }}>
                <h4 className="mb-2 text-lg font-medium text-white">{card.title}</h4>
                <div className="flex-1">
                  <p className="text-sm text-white/90">{card.sentences}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }
};

export const RapidTextAppend: Story = {
  render: () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [text, setText] = useState<string>('');
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout>();
    const { isAutoScrollEnabled, enableAutoScroll, disableAutoScroll } = useAutoScroll(
      containerRef,
      { observeSubTree: true, observeCharacterData: true, observeAttributes: false }
    );

    const addWord = useCallback(() => {
      const randomWord = faker.word.words(2);
      setText((old) => `${old} ${randomWord}`);
    }, []);

    const toggleRunning = useCallback(() => {
      if (isRunning) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
        }
        setIsRunning(false);
      } else {
        intervalRef.current = setInterval(addWord, 10);
        setIsRunning(true);
        enableAutoScroll();
      }
    }, [isRunning, addWord, enableAutoScroll]);

    // Cleanup interval on unmount
    useEffect(() => {
      toggleRunning();
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, []);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Rapid Text Append</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleRunning}
              className={`rounded px-3 py-1 text-sm text-white ${
                isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}>
              {isRunning ? 'Stop' : 'Start'} Adding Words
            </button>
            <button
              type="button"
              onClick={isAutoScrollEnabled ? disableAutoScroll : enableAutoScroll}
              className={`rounded px-3 py-1 text-sm text-white ${
                isAutoScrollEnabled
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}>
              Auto-scroll {isAutoScrollEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        <ScrollArea
          viewportRef={containerRef}
          className="h-[200px] w-[300px] rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap gap-1">{text}</div>
        </ScrollArea>
      </div>
    );
  }
};
