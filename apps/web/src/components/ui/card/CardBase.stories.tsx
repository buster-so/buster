import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './CardBase';

const meta = {
  title: 'UI/Cards/Card',
  component: Card,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Base Card with all components
export const Complete: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader variant="default" size="default">
        <CardTitle>Default Header</CardTitle>
        <CardDescription>
          This is a description for the card explaining its purpose.
        </CardDescription>
      </CardHeader>
      <CardContent size="default">
        <p>
          This is the main content area of the card. It can contain any content you want to display.
        </p>
      </CardContent>
      <CardFooter size="default" border>
        <p>Footer with border</p>
      </CardFooter>
    </Card>
  )
};
// Showcase different header variants
export const HeaderVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Card className="w-[350px]">
        <CardHeader variant="default">
          <CardTitle>Default Header</CardTitle>
          <CardDescription>Default header variant</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>

      <Card className="w-[350px]">
        <CardHeader variant="gray">
          <CardTitle>Gray Header</CardTitle>
          <CardDescription>Gray header variant with background</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>

      <Card className="w-[350px]">
        <CardHeader variant="white">
          <CardTitle>White Header</CardTitle>
          <CardDescription>White header variant with background</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    </div>
  )
};

// Showcase different sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Card className="w-[350px]">
        <CardHeader size="default">
          <CardTitle>Default Size</CardTitle>
        </CardHeader>
        <CardContent size="default">
          <p>Content with default padding</p>
        </CardContent>
        <CardFooter size="default">
          <p>Footer with default padding</p>
        </CardFooter>
      </Card>

      <Card className="w-[350px]">
        <CardHeader size="small">
          <CardTitle>Small Size</CardTitle>
        </CardHeader>
        <CardContent size="small">
          <p>Content with small padding</p>
        </CardContent>
        <CardFooter size="small">
          <p>Footer with small padding</p>
        </CardFooter>
      </Card>
    </div>
  )
};

// Showcase footer variants
export const FooterVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Card className="w-[350px]">
        <CardContent>Content</CardContent>
        <CardFooter border={false}>
          <p>Footer without border</p>
        </CardFooter>
      </Card>

      <Card className="w-[350px]">
        <CardContent>Content</CardContent>
        <CardFooter border>
          <p>Footer with border</p>
        </CardFooter>
      </Card>
    </div>
  )
};
