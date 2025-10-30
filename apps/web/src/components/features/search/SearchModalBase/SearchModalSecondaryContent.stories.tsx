import type { SearchTextData } from '@buster/server-shared/search';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchModalSecondaryContent } from './SearchModalSecondaryContent';

const meta: Meta<typeof SearchModalSecondaryContent> = {
  title: 'Features/Search/SearchModalSecondaryContent',
  component: SearchModalSecondaryContent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockSearchTextData: SearchTextData = {
  assetId: '123e4567-e89b-12d3-a456-426614174000',
  assetType: 'chat',
  title: 'Revenue Analysis Q4 2024',
  additionalText: 'This is a comprehensive analysis of Q4 revenue trends',
  updatedAt: new Date().toISOString(),
  screenshotBucketKey: 'screenshots/mock-screenshot.png',
  screenshotUrl: faker.image.url({
    width: 430,
    height: 240,
  }),
  ancestors: {
    chats: [
      {
        id: '456e7890-e89b-12d3-a456-426614174001',
        title: 'Parent Chat',
      },
    ],
    dashboards: [
      {
        id: '789e0123-e89b-12d3-a456-426614174002',
        title: 'Executive Dashboard',
      },
    ],
    reports: [],
    collections: [],
  },

  createdBy: '123e4567-e89b-12d3-a456-426614174000',
  createdByName: 'John Doe',
  createdByAvatarUrl: faker.image.url({
    width: 200,
    height: 200,
  }),
};

export const Default: Story = {
  args: {
    selectedItem: mockSearchTextData,
  },
  decorators: [
    (Story) => (
      <div className="w-[420px] h-[420px] border-red-500 border">
        <Story />
      </div>
    ),
  ],
};
