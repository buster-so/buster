import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BarContainer } from './BarContainer';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/buttons';

const meta = {
  title: 'Controllers/ReasoningController/BarContainer',
  component: BarContainer,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['completed', 'loading', 'failed']
    },
    showBar: {
      control: { type: 'boolean' }
    },
    isCompletedStream: {
      control: { type: 'boolean' }
    },
    title: {
      control: { type: 'text' }
    },
    secondaryTitle: {
      control: { type: 'text' }
    }
  }
} satisfies Meta<typeof BarContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showBar: true,
    status: 'completed',
    isCompletedStream: true,
    title: 'Processing Data',
    secondaryTitle: 'Step 1 of 3'
  }
};

export const Loading: Story = {
  args: {
    showBar: true,
    status: 'loading',
    isCompletedStream: false,
    title: 'Analyzing Query',
    secondaryTitle: 'Please wait...'
  }
};

export const Failed: Story = {
  args: {
    showBar: true,
    status: 'failed',
    isCompletedStream: true,
    title: 'Processing Failed',
    secondaryTitle: 'Unable to complete'
  }
};

export const WithoutBar: Story = {
  args: {
    showBar: false,
    status: 'completed',
    isCompletedStream: true,
    title: 'Simple Title',
    secondaryTitle: 'No bar displayed'
  }
};

export const NoSecondaryTitle: Story = {
  args: {
    showBar: true,
    status: 'completed',
    isCompletedStream: true,
    title: 'Just a Title'
  }
};

export const WithChildren: Story = {
  args: {
    showBar: true,
    status: 'completed',
    isCompletedStream: true,
    title: 'Container with Content',
    secondaryTitle: 'Has children'
  },
  render: (args) => (
    <BarContainer {...args}>
      <div className="rounded-md bg-gray-100 p-4">
        <Text size="sm" variant="secondary">
          This is some child content that appears below the title section.
        </Text>
        <Text size="sm" variant="tertiary" className="mt-2">
          It can contain any React elements.
        </Text>
      </div>
    </BarContainer>
  )
};

export const LongTitles: Story = {
  args: {
    showBar: true,
    status: 'loading',
    isCompletedStream: false,
    title: 'This is a very long title that might wrap or get truncated',
    secondaryTitle:
      'And this is also a very long secondary title that might not display on smaller containers'
  }
};

// Story that shows all states side by side
export const AllStates: Story = {
  args: {
    showBar: true,
    status: 'completed',
    isCompletedStream: true,
    title: 'Default',
    secondaryTitle: 'Default'
  },
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">All Status States</h3>
        <div className="space-y-4">
          <BarContainer
            showBar={true}
            status="loading"
            isCompletedStream={false}
            title="Loading State"
            secondaryTitle="In progress..."
          />
          <BarContainer
            showBar={true}
            status="completed"
            isCompletedStream={true}
            title="Completed State"
            secondaryTitle="Done!"
          />
          <BarContainer
            showBar={true}
            status="failed"
            isCompletedStream={true}
            title="Failed State"
            secondaryTitle="Error occurred"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Different Bar Configurations</h3>
        <div className="space-y-4">
          <BarContainer
            showBar={false}
            status="completed"
            isCompletedStream={true}
            title="No Bar"
            secondaryTitle="Bar hidden"
          />
          <BarContainer
            showBar={true}
            status="completed"
            isCompletedStream={true}
            title="Only Primary Title"
          />
        </div>
      </div>
    </div>
  )
};

export const InteractiveContent: Story = {
  args: {
    showBar: true,
    status: 'completed',
    isCompletedStream: true,
    title: 'Interactive Container',
    secondaryTitle: 'Click to add content'
  },
  render: (args) => {
    const [textItems, setTextItems] = useState<string[]>(['Initial content item']);
    const [title, setTitle] = useState('Interactive Container');

    const addTextItem = () => {
      const newItem = `Added item ${textItems.length}`;
      setTextItems((prev) => [...prev, newItem]);
    };

    const clearItems = () => {
      setTextItems(['Initial content item']);
    };

    const changeTitle = () => {
      const titles = [
        'Interactive Container',
        'Dynamic Title Example',
        'Updated Title State',
        'Custom Title Text',
        'Another Title Change'
      ];
      const currentIndex = titles.indexOf(title);
      const nextIndex = (currentIndex + 1) % titles.length;
      setTitle(titles[nextIndex]);
    };

    return (
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={addTextItem} size="small" variant="primary">
            Add Text Item
          </Button>
          <Button onClick={clearItems} size="small" variant="outlined">
            Reset Items
          </Button>
          <Button onClick={changeTitle} size="small" variant="ghost">
            Change Title
          </Button>
        </div>

        <BarContainer {...args} title={title}>
          <div className="space-y-2">
            {textItems.map((item, index) => (
              <div key={index} className="rounded border bg-gray-50 p-2">
                <Text size="sm" variant="secondary">
                  {item}
                </Text>
              </div>
            ))}
          </div>
        </BarContainer>
      </div>
    );
  }
};
