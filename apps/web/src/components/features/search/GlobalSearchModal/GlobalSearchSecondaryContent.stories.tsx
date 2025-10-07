import type { SearchTextData } from '@buster/server-shared/search';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GlobalSearchSecondaryContent } from './GlobalSearchSecondaryContent';

const meta: Meta<typeof GlobalSearchSecondaryContent> = {
  title: 'Features/Search/GlobalSearchSecondaryContent',
  component: GlobalSearchSecondaryContent,
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
  createdBy: {
    id: 'abc123',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatarUrl: faker.image.url({
      width: 100,
      height: 100,
    }),
  },
};

export const Default: Story = {
  args: {
    selectedItem: mockSearchTextData,
  },
};
