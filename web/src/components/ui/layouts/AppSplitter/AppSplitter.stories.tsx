import type { Meta, StoryObj } from '@storybook/react';
import React, { useRef } from 'react';
import { AppSplitter, type AppSplitterRef } from './AppSplitter';
import { useAppSplitterContext } from './AppSplitterProvider';
import { Title } from '@/components/ui/typography/Title';
import { Text } from '@/components/ui/typography/Text';
import { Button } from '@/components/ui/buttons/Button';

const meta: Meta<typeof AppSplitter> = {
  title: 'UI/layouts/AppSplitter',
  component: AppSplitter,
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', width: '100%', border: '1px solid #ccc' }}>
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
type Story = StoryObj<typeof AppSplitter>;

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
    defaultLayout: ['auto', '200px'],
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
        <AppSplitter
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

// Story with animation controls via ref
const AnimationViaRefExample = () => {
  const splitterRef = useRef<AppSplitterRef>(null);

  const handleAnimateLeft = (size: string) => {
    splitterRef.current?.animateWidth(size, 'left', 200);
  };

  const handleAnimateRight = (size: string) => {
    splitterRef.current?.animateWidth(size, 'right', 200);
  };

  return (
    <AppSplitter
      ref={splitterRef}
      leftChildren={
        <div className="h-full bg-blue-100 p-4">
          <h2 className="mb-4 text-lg font-semibold">Left Panel (via Ref)</h2>
          <div className="space-y-2">
            <Button onClick={() => handleAnimateLeft('200px')}>Set Left to 200px</Button>
            <Button onClick={() => handleAnimateLeft('400px')}>Set Left to 400px</Button>
            <Button onClick={() => handleAnimateLeft('30%')}>Set Left to 30%</Button>
            <Button onClick={() => handleAnimateLeft('50%')}>Set Left to 50%</Button>
          </div>
        </div>
      }
      rightChildren={
        <div className="h-full bg-green-100 p-4">
          <h2 className="mb-4 text-lg font-semibold">Right Panel (via Ref)</h2>
          <div className="space-y-2">
            <Button onClick={() => handleAnimateRight('200px')}>Set Right to 200px</Button>
            <Button onClick={() => handleAnimateRight('400px')}>Set Right to 400px</Button>
            <Button onClick={() => handleAnimateRight('30%')}>Set Right to 30%</Button>
            <Button onClick={() => handleAnimateRight('50%')}>Set Right to 50%</Button>
          </div>
        </div>
      }
      autoSaveId="animation-ref-splitter"
      defaultLayout={['50%', 'auto']}
      preserveSide="left"
      leftPanelMinSize={150}
      rightPanelMinSize={150}
    />
  );
};

export const AnimationViaRef: Story = {
  render: () => <AnimationViaRefExample />
};

// Story with animation controls via context
const ContextControlPanel = () => {
  const animateWidth = useAppSplitterContext((ctx) => ctx.animateWidth);
  const sizes = useAppSplitterContext((ctx) => ctx.sizes);
  const getSizesInPixels = useAppSplitterContext((ctx) => ctx.getSizesInPixels);

  const handleGetSizes = () => {
    const [leftPx, rightPx] = getSizesInPixels();
    alert(`Current sizes - Left: ${leftPx}px, Right: ${rightPx}px`);
  };

  return (
    <div className="p-4">
      <h3 className="mb-4 text-lg font-semibold">Context Controls</h3>
      <p className="mb-4 text-sm text-gray-600">Current sizes: {sizes.join(', ')}</p>
      <div className="space-y-2">
        <Button onClick={() => animateWidth('300px', 'left', 800)}>
          Animate Left to 300px (800ms)
        </Button>
        <Button onClick={() => animateWidth('40%', 'left', 600)}>
          Animate Left to 40% (600ms)
        </Button>
        <Button onClick={() => animateWidth('250px', 'right', 1000)}>
          Animate Right to 250px (1s)
        </Button>
        <Button onClick={() => animateWidth('35%', 'right', 400)}>
          Animate Right to 35% (400ms)
        </Button>
        <Button onClick={handleGetSizes}>Get Sizes in Pixels</Button>
      </div>
    </div>
  );
};

const AnimationViaContextExample = () => {
  return (
    <AppSplitter
      leftChildren={
        <div className="h-full bg-purple-100">
          <ContextControlPanel />
        </div>
      }
      rightChildren={
        <div className="h-full bg-yellow-100 p-4">
          <h2 className="text-lg font-semibold">Right Panel (via Context)</h2>
          <p>The controls in the left panel use the context to animate both panels.</p>
        </div>
      }
      autoSaveId="animation-context-splitter"
      defaultLayout={['400px', 'auto']}
      preserveSide="left"
      leftPanelMinSize={200}
      rightPanelMinSize={200}
    />
  );
};

export const AnimationViaContext: Story = {
  render: () => <AnimationViaContextExample />
};

// Story demonstrating different animation durations
const AnimationDurationsExample = () => {
  const splitterRef = useRef<AppSplitterRef>(null);

  const animations = [
    { label: 'Default', duration: undefined, size: '100px' },
    { label: 'Fast (200ms)', duration: 200, size: '300px' },
    { label: 'Normal (500ms)', duration: 500, size: '400px' },
    { label: 'Slow (1000ms)', duration: 1000, size: '500px' },
    { label: 'Very Slow (2000ms)', duration: 2000, size: '250px' }
  ];

  return (
    <AppSplitter
      ref={splitterRef}
      leftChildren={
        <div className="h-full bg-indigo-100 p-4">
          <h2 className="mb-4 text-lg font-semibold">Animation Durations</h2>
          <div className="space-y-2">
            {animations.map((anim) => (
              <Button
                key={anim.label}
                onClick={() => splitterRef.current?.animateWidth(anim.size, 'left', anim.duration)}>
                {anim.label} → {anim.size}
              </Button>
            ))}
          </div>
        </div>
      }
      rightChildren={
        <div className="h-full bg-pink-100 p-4">
          <h2 className="text-lg font-semibold">Right Panel</h2>
          <p>Watch the different animation speeds with smooth easing!</p>
        </div>
      }
      autoSaveId="animation-durations-splitter"
      defaultLayout={['350px', 'auto']}
      preserveSide="left"
      leftPanelMinSize={200}
      rightPanelMinSize={200}
    />
  );
};

export const AnimationDurations: Story = {
  render: () => <AnimationDurationsExample />
};

// Story for horizontal split with animations
export const HorizontalWithAnimation: Story = {
  render: () => {
    const splitterRef = useRef<AppSplitterRef>(null);

    return (
      <AppSplitter
        ref={splitterRef}
        split="horizontal"
        leftChildren={
          <div className="h-full w-full bg-teal-100 p-4">
            <h2 className="mb-4 text-lg font-semibold">Top Panel</h2>
            <div className="space-x-2">
              <Button onClick={() => splitterRef.current?.animateWidth('200px', 'left', 500)}>
                Top to 200px
              </Button>
              <Button onClick={() => splitterRef.current?.animateWidth('40%', 'left', 500)}>
                Top to 40%
              </Button>
            </div>
          </div>
        }
        rightChildren={
          <div className="h-full w-full bg-orange-100 p-4">
            <h2 className="mb-4 text-lg font-semibold">Bottom Panel</h2>
            <div className="space-x-2">
              <Button onClick={() => splitterRef.current?.animateWidth('250px', 'right', 500)}>
                Bottom to 250px
              </Button>
              <Button onClick={() => splitterRef.current?.animateWidth('60%', 'right', 500)}>
                Bottom to 60%
              </Button>
            </div>
          </div>
        }
        autoSaveId="horizontal-animation-splitter"
        defaultLayout={['50%', 'auto']}
        preserveSide="left"
        leftPanelMinSize={100}
        rightPanelMinSize={100}
      />
    );
  }
};

// Three panel layout with animation controls
const ThreePanelWithAnimationExample = () => {
  const outerSplitterRef = useRef<AppSplitterRef>(null);
  const innerSplitterRef = useRef<AppSplitterRef>(null);

  // Animation controls for left panel (outer splitter left side)
  const animateLeftPanel = (size: string, duration = 500) => {
    outerSplitterRef.current?.animateWidth(size, 'left', duration);
  };

  // Animation controls for middle panel (inner splitter left side)
  const animateMiddlePanel = (size: string, duration = 500) => {
    innerSplitterRef.current?.animateWidth(size, 'left', duration);
  };

  // Animation controls for right panel (inner splitter right side)
  const animateRightPanel = (size: string, duration = 500) => {
    innerSplitterRef.current?.animateWidth(size, 'right', duration);
  };

  return (
    <AppSplitter
      ref={outerSplitterRef}
      leftChildren={
        <div className="h-full bg-blue-100/20 p-4">
          <Title as="h3" className="mb-4">
            Left Panel
          </Title>
          <Text className="text-muted-foreground mb-4">
            Control this panel with the buttons below:
          </Text>
          <div className="space-y-2">
            <Button onClick={() => animateLeftPanel('200px')} className="w-full" variant="outlined">
              Set to 200px
            </Button>
            <Button onClick={() => animateLeftPanel('300px')} className="w-full" variant="outlined">
              Set to 300px
            </Button>
            <Button onClick={() => animateLeftPanel('25%')} className="w-full" variant="outlined">
              Set to 25%
            </Button>
            <Button
              onClick={() => animateLeftPanel('400px', 1000)}
              className="w-full"
              variant="outlined">
              Set to 400px (slow)
            </Button>
          </div>

          <div className="bg-muted/20 mt-6 rounded p-3">
            <Text className="text-sm font-medium">Animation Test</Text>
            <Text className="text-muted-foreground mt-1 text-xs">
              This panel is preserved by the outer splitter
            </Text>
          </div>
        </div>
      }
      rightChildren={
        <div className="flex h-full w-full overflow-hidden">
          <AppSplitter
            ref={innerSplitterRef}
            leftChildren={
              <div className="h-full bg-green-100/20 p-4">
                <Title as="h3" className="mb-4">
                  Middle Panel
                </Title>
                <Text className="text-muted-foreground mb-4">
                  This panel takes remaining space when the right panel resizes:
                </Text>
                <div className="space-y-2">
                  <Button
                    onClick={() => animateMiddlePanel('auto')}
                    className="w-full"
                    variant="outlined">
                    Set to Auto
                  </Button>
                  <Button
                    onClick={() => animateMiddlePanel('50%')}
                    className="w-full"
                    variant="outlined">
                    Set to 50%
                  </Button>
                  <Button
                    onClick={() => animateMiddlePanel('60%')}
                    className="w-full"
                    variant="outlined">
                    Set to 60%
                  </Button>
                </div>

                <div className="bg-muted/20 mt-6 rounded p-3">
                  <Text className="text-sm font-medium">Global Controls</Text>
                  <Text className="text-muted-foreground mt-1 mb-3 text-xs">
                    Control all panels with these buttons:
                  </Text>
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        animateLeftPanel('250px', 800);
                        setTimeout(() => animateRightPanel('300px', 800), 200);
                        setTimeout(() => animateMiddlePanel('auto', 800), 400);
                      }}
                      className="w-full"
                      variant="default"
                      size="small">
                      Cascade Animation
                    </Button>
                    <Button
                      onClick={() => {
                        animateLeftPanel('300px');
                        animateRightPanel('350px');
                        animateMiddlePanel('auto');
                      }}
                      className="w-full"
                      variant="default"
                      size="small">
                      Sync Animation
                    </Button>
                  </div>
                </div>
              </div>
            }
            rightChildren={
              <div className="h-full bg-purple-100/20 p-4">
                <Title as="h3" className="mb-4">
                  Right Panel
                </Title>
                <Text className="text-muted-foreground mb-4">
                  This panel is preserved by the inner splitter:
                </Text>
                <div className="space-y-2">
                  <Button
                    onClick={() => animateRightPanel('250px')}
                    className="w-full"
                    variant="outlined">
                    Set to 250px
                  </Button>
                  <Button
                    onClick={() => animateRightPanel('350px')}
                    className="w-full"
                    variant="outlined">
                    Set to 350px
                  </Button>
                  <Button
                    onClick={() => animateRightPanel('30%')}
                    className="w-full"
                    variant="outlined">
                    Set to 30%
                  </Button>
                  <Button
                    onClick={() => animateRightPanel('400px', 1500)}
                    className="w-full"
                    variant="outlined">
                    Set to 400px (very slow)
                  </Button>
                  <Button
                    onClick={() => animateRightPanel('0px')}
                    className="w-full"
                    variant="danger">
                    Close Panel (0px)
                  </Button>
                  <Button
                    onClick={() => animateRightPanel('320px')}
                    className="w-full"
                    variant="primary">
                    Reopen Panel (320px)
                  </Button>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="bg-muted/20 rounded p-3">
                    <Text className="text-sm font-medium">Speed Tests</Text>
                    <div className="mt-2 space-y-1">
                      <Button
                        onClick={() => animateRightPanel('200px', 100)}
                        className="w-full"
                        variant="ghost"
                        size="small">
                        Fast (100ms)
                      </Button>
                      <Button
                        onClick={() => animateRightPanel('450px', 2000)}
                        className="w-full"
                        variant="ghost"
                        size="small">
                        Ultra Slow (2s)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            }
            autoSaveId="three-panel-inner"
            defaultLayout={['auto', '320px']}
            preserveSide="right"
            rightPanelMinSize={200}
            rightPanelMaxSize={600}
            leftPanelMinSize={250}
          />
        </div>
      }
      autoSaveId="three-panel-outer"
      defaultLayout={['280px', 'auto']}
      preserveSide="left"
      leftPanelMinSize={200}
      leftPanelMaxSize={500}
    />
  );
};

export const ThreePanelWithAnimation: Story = {
  render: () => <ThreePanelWithAnimationExample />
};
