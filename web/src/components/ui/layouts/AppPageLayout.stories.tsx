import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { AppPageLayout } from './AppPageLayout';

const meta: Meta<typeof AppPageLayout> = {
  title: 'UI/Layouts/AppPageLayout',
  component: AppPageLayout,
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-background-secondary" style={{ height: '500px', width: '100%' }}>
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof AppPageLayout>;

export const Default: Story = {
  args: {
    children: <div className="">Page Content</div>
  }
};

export const WithHeader: Story = {
  args: {
    header: <div className="bg-gray-100">Header Content</div>,
    children: <div className="">Page Content</div>
  }
};

export const NonScrollable: Story = {
  args: {
    scrollable: false,
    header: <div className="bg-gray-100">Header Content</div>,
    children: <div className="h-full w-full border border-red-500 bg-red-100">Fixed Content</div>
  }
};

export const WithCustomClassName: Story = {
  args: {
    className: 'bg-gray-50',
    header: <div className="">Header Content</div>,
    children: <div className="">Content with custom background</div>
  }
};

export const LongContent: Story = {
  args: {
    header: <div className="">Header Content</div>,
    scrollable: true,
    headerBorderVariant: 'ghost',
    children: (
      <div className="border border-red-500 bg-red-100 p-1">
        {Array.from({ length: 100 }, (_, i) => (
          <p key={i} className="mb-4">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </p>
        ))}
      </div>
    )
  }
};

/*
    <AppPageLayout
      contentContainerId={CHAT_CONTENT_CONTAINER_ID}
      header={<ChatHeader />}
      headerBorderVariant="ghost"
      scrollable
      className="flex h-full w-full min-w-[295px] flex-col">
      <ChatContent />
    </AppPageLayout>
*/

export const LongContentGhostHeader: Story = {
  args: {
    contentContainerId: 'chat-container-content',
    header: <div className="">Header Content</div>,
    scrollable: true,
    //  className: 'flex h-full w-full min-w-[295px] flex-col',
    headerBorderVariant: 'ghost',
    children: (
      <div className="">
        {Array.from({ length: 100 }, (_, i) => (
          <p key={i} className="mb-4">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </p>
        ))}
      </div>
    )
  }
};
