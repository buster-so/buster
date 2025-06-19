import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';
import Image from 'next/image';
import { ScrollArea, ScrollBar } from './ScrollArea';

const meta = {
  title: 'UI/ScrollArea/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
      <div>
        <p className="mb-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget
          ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.
        </p>
        <p className="mb-4">
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
          laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
          architecto beatae vitae dicta sunt explicabo.
        </p>
        <p className="mb-4">
          Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
          consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
        </p>
        <p className="mb-4">
          Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci
          velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam
          quaerat voluptatem.
        </p>
        <p>
          Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam,
          nisi ut aliquid ex ea commodi consequatur.
        </p>
      </div>
    </ScrollArea>
  )
};

export const TallContent: Story = {
  render: () => (
    <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
      <div>
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="mb-2">
            Row {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
};

export const WideContent: Story = {
  render: () => {
    const works = Array.from({ length: 50 }, (_, i) => ({
      artist: `Artist ${i + 1}`,
      art: faker.image.urlLoremFlickr({ category: 'food', width: 300, height: 400 })
    }));

    return (
      <ScrollArea className="w-96 rounded-md border whitespace-nowrap">
        <div className="flex w-max space-x-4 p-4">
          {works.map((artwork) => (
            <figure key={artwork.artist} className="shrink-0">
              <div className="overflow-hidden rounded-md">
                <Image
                  src={artwork.art}
                  alt={`Photo by ${artwork.artist}`}
                  className="aspect-[3/4] h-fit w-fit object-cover"
                  width={300}
                  height={400}
                />
              </div>
              <figcaption className="text-gray-light pt-2 text-xs">
                Photo by <span className="text-foreground font-semibold">{artwork.artist}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  }
};
