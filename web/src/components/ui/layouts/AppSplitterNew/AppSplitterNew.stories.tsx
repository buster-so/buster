import type { Meta, StoryObj } from '@storybook/react';
import { AppSplitterNew } from './AppSplitterNew';
import { Title } from '@/components/ui/typography/Title';
import { Text } from '@/components/ui/typography/Text';

const meta: Meta<typeof AppSplitterNew> = {
  title: 'UI/layouts/AppSplitterNew',
  component: AppSplitterNew,
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh' }}>
        <Story />
      </div>
    )
  ],
  argTypes: {
    split: {
      control: 'select',
      options: ['vertical', 'horizontal']
    },
    preserveSide: {
      control: 'select',
      options: ['left', 'right']
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper components for demo content
const LeftContent = ({ title = 'Left Panel' }: { title?: string }) => (
  <div className="bg-muted/20 h-full bg-blue-100/10 p-6">
    <Title as="h3">{title}</Title>
    <Text className="text-muted-foreground mt-2">
      This is the left panel content. Try resizing the panels by dragging the splitter.
    </Text>
    <div className="mt-4 space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-muted/40 rounded p-3">
          <Text>Navigation Item {i}</Text>
        </div>
      ))}
    </div>
  </div>
);

const RightContent = ({ title = 'Right Panel' }: { title?: string }) => (
  <div className="h-full bg-red-100/10 p-6">
    <Title as="h2">{title}</Title>
    <Text className="text-muted-foreground mt-2">
      This is the right panel content. The panel sizes are automatically saved to localStorage.
    </Text>
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-muted/10 flex h-32 items-center justify-center rounded-lg border">
          <Text>Content Block {i}</Text>
        </div>
      ))}
    </div>
  </div>
);

// 1. Left panel preserved (default behavior)
export const LeftPanelPreserved: Story = {
  args: {
    leftChildren: <LeftContent title="Left Panel (Preserved)" />,
    rightChildren: <RightContent title="Right Panel (Auto)" />,
    autoSaveId: 'left-preserved',
    defaultLayout: ['300px', 'auto'],
    preserveSide: 'left'
  }
};

// 2. Right panel preserved
export const RightPanelPreserved: Story = {
  args: {
    leftChildren: <LeftContent title="Left Panel (Auto)" />,
    rightChildren: <RightContent title="Right Panel (Preserved)" />,
    autoSaveId: 'right-preserved',
    defaultLayout: ['auto', '400px'],
    preserveSide: 'right'
  }
};

// 3. Horizontal split - top preserved
export const HorizontalTopPreserved: Story = {
  args: {
    leftChildren: <LeftContent title="Top Panel (Preserved)" />,
    rightChildren: <RightContent title="Bottom Panel (Auto)" />,
    autoSaveId: 'horizontal-top',
    defaultLayout: ['200px', 'auto'],
    split: 'horizontal',
    preserveSide: 'left'
  }
};

// 4. Horizontal split - bottom preserved
export const HorizontalBottomPreserved: Story = {
  args: {
    leftChildren: <LeftContent title="Top Panel (Auto)" />,
    rightChildren: <RightContent title="Bottom Panel (Preserved)" />,
    autoSaveId: 'horizontal-bottom',
    defaultLayout: ['auto', '300px'],
    split: 'horizontal',
    preserveSide: 'right'
  }
};

// 5. With min and max sizes
export const WithMinMaxSizes: Story = {
  args: {
    leftChildren: (
      <div className="bg-muted/20 h-full p-6">
        <Title as="h3">Constrained Panel</Title>
        <Text className="text-muted-foreground mt-2">
          This panel has min size of 200px and max size of 500px.
        </Text>
        <div className="bg-muted/40 mt-4 rounded p-3">
          <Text>Try to resize beyond these limits!</Text>
        </div>
      </div>
    ),
    rightChildren: <RightContent />,
    autoSaveId: 'min-max-sizes',
    defaultLayout: ['300px', 'auto'],
    leftPanelMinSize: 200,
    leftPanelMaxSize: 500,
    rightPanelMinSize: 300,
    preserveSide: 'left'
  }
};

// 6. Splitter hidden
export const SplitterHidden: Story = {
  args: {
    leftChildren: <LeftContent />,
    rightChildren: <RightContent />,
    autoSaveId: 'splitter-hidden',
    defaultLayout: ['300px', 'auto'],
    hideSplitter: true,
    preserveSide: 'left'
  }
};

// 7. Left panel hidden
export const LeftPanelHidden: Story = {
  args: {
    leftChildren: <LeftContent />,
    rightChildren: (
      <div className="h-full p-6">
        <Title as="h2">Full Width Content</Title>
        <Text className="text-muted-foreground mt-2">
          The left panel is hidden, so this content takes the full width.
        </Text>
      </div>
    ),
    autoSaveId: 'left-hidden',
    defaultLayout: ['300px', 'auto'],
    leftHidden: true,
    preserveSide: 'left'
  }
};

// 8. Custom splitter class
export const CustomSplitterClass: Story = {
  args: {
    leftChildren: <LeftContent />,
    rightChildren: <RightContent />,
    autoSaveId: 'custom-splitter',
    defaultLayout: ['300px', 'auto'],
    splitterClassName: 'bg-red-500 hover:bg-red-500/80 min-w-2',
    preserveSide: 'left'
  }
};

// 9. Resize disabled
export const ResizeDisabled: Story = {
  args: {
    leftChildren: (
      <div className="bg-muted/20 h-full p-6">
        <Title as="h3">Fixed Width Panel</Title>
        <Text className="text-muted-foreground mt-2">
          Resizing is disabled. The splitter cannot be dragged.
        </Text>
      </div>
    ),
    rightChildren: <RightContent />,
    autoSaveId: 'resize-disabled',
    defaultLayout: ['300px', 'auto'],
    allowResize: false,
    preserveSide: 'left'
  }
};

// Additional story: Percentage-based sizing
export const PercentageBasedSizing: Story = {
  args: {
    leftChildren: (
      <div className="bg-muted/20 h-full p-6">
        <Title as="h3">30% Width Panel</Title>
        <Text className="text-muted-foreground mt-2">
          This panel starts at 30% of the container width.
        </Text>
      </div>
    ),
    rightChildren: <RightContent title="70% Width Panel" />,
    autoSaveId: 'percentage-sizing',
    defaultLayout: ['30%', 'auto'],
    preserveSide: 'left'
  }
};

// Interactive playground story
export const Playground: Story = {
  args: {
    leftChildren: <LeftContent />,
    rightChildren: <RightContent />,
    autoSaveId: 'playground',
    defaultLayout: ['300px', 'auto'],
    preserveSide: 'left',
    leftPanelMinSize: 200,
    leftPanelMaxSize: 600,
    rightPanelMinSize: 200,
    allowResize: true,
    split: 'vertical',
    hideSplitter: false,
    leftHidden: false,
    rightHidden: false
  }
};

// Nested Three Panel Layout Story
export const NestedThreePanel: Story = {
  args: {
    leftChildren: (
      <div className="h-full bg-green-100/10 p-6">
        <Title as="h3">Left Panel</Title>
        <Text className="text-muted-foreground mt-2">
          This is the leftmost panel. It&apos;s preserved when resizing the parent splitter.
        </Text>
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-muted/40 rounded p-3">
              <Text>Navigation Item {i}</Text>
            </div>
          ))}
        </div>
      </div>
    ),
    rightChildren: (
      <div className="flex h-full w-full overflow-hidden">
        <AppSplitterNew
          leftChildren={
            <div className="h-full bg-blue-100/10 p-6">
              <Title as="h3">Middle Panel</Title>
              <Text className="text-muted-foreground mt-2">
                This is the middle panel. It takes the remaining space when the right panel is
                resized.
              </Text>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-muted/10 flex h-24 items-center justify-center rounded-lg border">
                    <Text>Content Block {i}</Text>
                  </div>
                ))}
              </div>
            </div>
          }
          rightChildren={
            <div className="h-full bg-purple-100/10 p-6">
              <Title as="h3">Right Panel</Title>
              <Text className="text-muted-foreground mt-2">
                This is the rightmost panel. It&apos;s preserved when resizing the nested splitter.
              </Text>
              <div className="mt-4 space-y-3">
                <div className="bg-muted/20 rounded p-4">
                  <Title as="h4" className="mb-2">
                    Details
                  </Title>
                  <Text className="text-sm">
                    The parent splitter preserves the left panel, while the nested splitter
                    preserves the right panel. This creates a flexible 3-panel layout.
                  </Text>
                </div>
                <div className="bg-muted/20 rounded p-4">
                  <Title as="h4" className="mb-2">
                    Usage
                  </Title>
                  <Text className="text-sm">
                    Try dragging both splitters to resize the panels. Each splitter&apos;s position
                    is saved independently in localStorage.
                  </Text>
                </div>
              </div>
            </div>
          }
          autoSaveId="nested-right"
          defaultLayout={['auto', '350px']}
          preserveSide="right"
          rightPanelMinSize={250}
          rightPanelMaxSize={500}
          leftPanelMinSize={300}
        />
      </div>
    ),
    autoSaveId: 'nested-three-panel',
    defaultLayout: ['250px', 'auto'],
    preserveSide: 'left',
    leftPanelMinSize: 200,
    leftPanelMaxSize: 400
  }
};
