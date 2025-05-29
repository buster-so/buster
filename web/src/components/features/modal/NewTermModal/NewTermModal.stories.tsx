import { BASE_URL } from '@/api/buster_rest/config';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { http, HttpResponse } from 'msw';
import { NewTermModal } from './NewTermModal';

interface TermRequestBody {
  name: string;
  definition: string;
  dataset_ids: string[];
}

const meta = {
  title: 'Features/Modal/NewTermModal',
  component: NewTermModal,
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [
        http.get(`${BASE_URL}/datasets`, () => {
          return HttpResponse.json([
            { id: '1', name: 'Customer Data' },
            { id: '2', name: 'Sales Data' },
            { id: '3', name: 'Product Analytics' }
          ]);
        }),
        http.post(`${BASE_URL}/terms`, async ({ request }) => {
          const body = (await request.json()) as TermRequestBody;
          return HttpResponse.json({
            success: true,
            data: {
              id: '123',
              name: body.name,
              definition: body.definition,
              dataset_ids: body.dataset_ids
            }
          });
        })
      ]
    }
  }
} satisfies Meta<typeof NewTermModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    onClose: fn()
  },
  parameters: {
    reactQuery: {
      logger: console
    }
  }
};
