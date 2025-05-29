'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type React from 'react';
import { InputTagInput } from './InputTagInput';

const meta: Meta<typeof InputTagInput> = {
  title: 'UI/Inputs/InputTagInput',
  component: InputTagInput,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'ghost', 'single']
    },
    size: {
      control: 'select',
      options: ['default', 'tall', 'small']
    },
    disabled: {
      control: 'boolean'
    },
    placeholder: {
      control: 'text'
    },
    maxTags: {
      control: 'number'
    },
    delimiter: {
      control: 'text',
      description: 'Character used to separate tags (default is comma)',
      table: {
        defaultValue: { summary: ',' }
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof InputTagInput>;

// Interactive component for Storybook
const InteractiveTagInput = (args: React.ComponentProps<typeof InputTagInput>) => {
  const [tags, setTags] = useState<string[]>(args.tags || []);

  const handleTagAdd = (tag: string | string[]) => {
    console.log('tag', tag);
    if (Array.isArray(tag)) {
      setTags([...tags, ...tag]);
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleTagRemove = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  return (
    <InputTagInput {...args} tags={tags} onTagAdd={handleTagAdd} onTagRemove={handleTagRemove} />
  );
};

export const Default: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    placeholder: 'Add tags...',
    tags: ['React', 'TypeScript']
  }
};

export const Ghost: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    variant: 'ghost',
    placeholder: 'Add tags...',
    tags: ['Ghost', 'Variant']
  }
};

export const Tall: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    size: 'tall',
    placeholder: 'Add tags...',
    tags: ['Tall', 'Size']
  }
};

export const Small: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    size: 'small',
    placeholder: 'Add tags...',
    tags: ['Small', 'Size']
  }
};

export const Disabled: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    disabled: true,
    placeholder: 'Disabled input',
    tags: ['Cannot', 'Edit', 'These']
  }
};

export const MaxTags: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    maxTags: 3,
    placeholder: 'Maximum 3 tags...',
    tags: ['First', 'Second']
  }
};

export const Empty: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    placeholder: 'Start typing to add tags...',
    tags: []
  }
};

export const CustomDelimiter: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    placeholder: 'Type or paste "tag1;tag2;tag3"...',
    delimiter: ';',
    tags: []
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use a custom delimiter (semicolon in this example) to separate tags. You can:\n' +
          '1. Type text and press the delimiter to create a tag\n' +
          '2. Paste a delimited list (e.g., "tag1;tag2;tag3")\n' +
          '3. Type or paste text with delimiters for automatic tag creation'
      }
    }
  }
};

export const SpaceDelimiter: Story = {
  render: (args) => <InteractiveTagInput {...args} />,
  args: {
    placeholder: 'Type or paste space-separated tags...',
    delimiter: ' ',
    tags: []
  },
  parameters: {
    docs: {
      description: {
        story: 'Using space as a delimiter. Perfect for handling space-separated lists of tags.'
      }
    }
  }
};
