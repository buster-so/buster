import type { Shortcut } from '@buster/server-shared';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useRef, useState } from 'react';
import { fn } from 'storybook/test';
import { createMentionSuggestionExtension } from './createMentionSuggestionOption';
import { MentionInput } from './MentionInput';
import type { MentionInputRef, MentionInputTriggerItem } from './MentionInput.types';

const meta = {
  title: 'UI/Inputs/MentionInput',
  component: MentionInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      return (
        <div className="w-full p-3 m-3 bg-background">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof MentionInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const looneyTunesCharacters: MentionInputTriggerItem[] = [
  {
    value: 'Bugs Bunny',
    label: 'Bugs Bunny',
  },
  {
    value: 'Daffy Duck',
    label: 'Daffy Duck',
  },
  {
    value: 'Porky Pig',
    label: 'Porky Pig',
  },
  {
    value: 'Tweety Bird',
    label: 'Tweety Bird',
  },
  {
    type: 'separator',
  },
  {
    value: 'Taz',
    label: 'Taz',
  },
  {
    value: 'Sylvester',
    label: 'Sylvester',
  },
];

const arthurCharacters: MentionInputTriggerItem[] = [
  {
    value: 'Arthur Read',
    label: 'Arthur Read',
  },
  {
    value: 'Buster Baxter',
    label: 'Buster Baxter',
  },
  {
    value: 'Mr Ratburn',
    label: 'Mr Ratburn',
  },
].map((item) => ({
  ...item,
  pillLabel: item.label,
  label: (
    <span className="flex flex-col justify-between space-y-2 py-2 overflow-hidden">
      <h3 className="font-semibold text-gray-900 text-base leading-tight">{item.label}</h3>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center text-sm text-gray-600 overflow-hidden">
          <span className="w-16 text-gray-500 font-medium truncate">Address:</span>
          <span className="truncate">
            {faker.location.streetAddress()}, {faker.location.city()}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="w-16 text-gray-500 font-medium">Phone:</span>
          <span>{faker.phone.number()}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="w-16 text-gray-500 font-medium">Birthday:</span>
          <span>
            {faker.date.birthdate({ min: 1970, max: 2005, mode: 'year' }).toLocaleDateString()}
          </span>
        </div>
      </div>
    </span>
  ),
}));

const looneyTunesSuggestions = createMentionSuggestionExtension({
  trigger: '@',
  items: ({ defaultQueryMentionsFilter, query }) =>
    defaultQueryMentionsFilter(query, looneyTunesCharacters),
  popoverContent: (props) => {
    return <div className="p-2">Hello {props.value}</div>;
  },
  pillStyling: {
    className: () => {
      return 'bg-purple-100 border-purple-300 text-purple-500 hover:bg-purple-200';
    },
  },
  onChangeTransform: (v) => {
    return `We can totally transform this into anything we want. The original value was [@${String(v.label)}](${String(v.value)})`;
  },
});

const theSimpsonsCharacters: MentionInputTriggerItem[] = [
  {
    value: 'Homer Simpson',
    label: 'Homer Simpson',
  },
  {
    value: 'Marge Simpson',
    label: 'Marge Simpson',
  },
  {
    value: 'Bart Simpson',
    label: 'Bart Simpson',
  },
  {
    value: 'Lisa Simpson',
    label: 'Lisa Simpson',
  },
  {
    value: 'Maggie Simpson',
    label: 'Maggie Simpson',
  },
  {
    value: 'Ned Flanders',
    label: 'Ned Flanders',
  },
].map((item) => ({
  ...item,
  label: (
    <span className="gap-x-1 space-x-1">
      <img
        src={faker.image.url({
          width: 16,
          height: 16,
        })}
        alt=""
        className="w-3 h-3 rounded-full bg-item-active inline-block align-middle"
      />
      <span className="inline-block">{item.label}</span>
    </span>
  ),
}));

const theSimpsonsSuggestions = createMentionSuggestionExtension({
  trigger: '#',
  items: ({ defaultQueryMentionsFilter, query }) =>
    defaultQueryMentionsFilter(query, theSimpsonsCharacters),
  pillStyling: {
    className: () => {
      return 'bg-blue-100 border-blue-300 text-blue-500 hover:bg-blue-200';
    },
  },
  popoverContent: (props) => {
    return <div className="p-2">Howdy {props.value}</div>;
  },
});

const arthurSuggestions = createMentionSuggestionExtension({
  trigger: '$',
  items: ({ defaultQueryMentionsFilter, query }) =>
    defaultQueryMentionsFilter(query, arthurCharacters),
  pillStyling: {
    className: () => {
      return 'bg-green-100 border-green-300 text-green-500 hover:bg-green-200';
    },
  },
  popoverContent: (props) => {
    return <div className="p-2">Ciao {props.value}</div>;
  },
});

const manyCharacters: MentionInputTriggerItem[] = [
  {
    type: 'group',
    items: [
      {
        value: 'SpongeBob SquarePants',
        label: 'SpongeBob SquarePants',
      },
      {
        value: 'Patrick Star',
        label: 'Patrick Star',
      },
      {
        value: 'Squidward Tentacles',
        label: 'Squidward Tentacles',
      },
      {
        value: 'Mr. Krabs',
        label: 'Mr. Krabs',
      },
    ],
    label: 'SpongeBob SquarePants Characters',
    className: 'bg-red-100',
  },
  {
    type: 'separator',
  },
  {
    type: 'group',
    items: [
      {
        value: 'Courage the Cowardly Dog',
        label: 'Courage the Cowardly Dog',
      },
      {
        value: 'Muriel Bagge',
        label: 'Muriel Bagge',
      },
      {
        value: 'Shaggy',
        label: 'Shaggy',
      },
      {
        value: 'Snake',
        label: 'Snake',
      },
    ],
    label: 'Courage the Cowardly Dog Characters',
  },
  {
    type: 'separator',
  },
  {
    type: 'group',
    label: 'Foster`s Home',
    items: [
      {
        value: 'Bloo',
        label: 'Bloo',
      },
      {
        value: 'Mac',
        label: 'Mac',
      },
      {
        value: 'Wilt',
        label: 'Wilt',
      },
      {
        value: 'Eduardo',
        label: 'Eduardo',
      },
    ],
  },
  {
    type: 'separator',
  },
  {
    type: 'group',
    label: 'Scooby-Doo Characters',
    items: [
      {
        value: 'Scooby-Doo',
        label: 'Scooby-Doo',
      },
      {
        value: 'Shaggy-Doo',
        label: 'Shaggy-Doo',
      },
      {
        value: 'Velma',
        label: 'Velma',
      },
      {
        value: 'Daphne',
        label: 'Daphne',
      },
    ],
  },
];

const spongebobSuggestions = createMentionSuggestionExtension({
  trigger: '%',
  items: ({ defaultQueryMentionsFilter, query }) =>
    defaultQueryMentionsFilter(query, manyCharacters),
  pillStyling: {
    className: () => {
      return 'bg-yellow-100 border-yellow-300 text-yellow-500 hover:bg-yellow-200';
    },
  },
  popoverContent: (props) => {
    return <div className="p-5 bg-red-100">This is a custom popover content for {props.value}</div>;
  },
  popoverClassName: 'bg-green-100 max-h-auto',
});

const shortcutsSuggestions = createMentionSuggestionExtension({
  trigger: '/',
  items: ({ defaultQueryMentionsFilter, editor, query }) => {
    const shortcuts: Shortcut[] = Array.from({ length: 10 }, () => ({
      id: faker.string.uuid(),
      name: faker.lorem.word(),
      instructions: faker.lorem.sentence(),
    })) as Shortcut[];
    const allItems: MentionInputTriggerItem[] = [
      {
        type: 'group',
        items: shortcuts.map((s) => {
          return {
            value: s.id,
            label: <div className="p-2 bg-blue-100">{s.name}</div>,
            pillLabel: s.name,
          };
        }),
        className: 'max-h-[300px] overflow-y-auto',
      },
      { type: 'separator' as const },
      {
        value: 'manageShortcuts',
        label: 'Manage shortcuts',
        icon: 'x',
        doNotAddPipeOnSelect: true,
        onSelect: () => {
          console.info('manage shortcuts');
        },
      },
      {
        value: 'createShortcut',
        label: 'Create shortcut',
        icon: 'y',
        doNotAddPipeOnSelect: true,
        onSelect: () => {
          console.info('create shortcut');
        },
      },
    ];
    return defaultQueryMentionsFilter(query, allItems);
  },
  popoverContent: (props) => {
    return <div className="p-2 min-w-[200px] h-[200px]">Manage shortcuts {props.value}</div>;
  },
  popoverClassName: 'bg-red-100',
  onChangeTransform: (v) => {
    return `We can totally transform this into anything we want. The original value was [/${String(v.label)}](${String(v.value)})`;
  },
});

export const Default: Story = {
  args: {
    className: 'min-w-64',
    placeholder: 'Enter text here...',
    mentions: [
      looneyTunesSuggestions,
      theSimpsonsSuggestions,
      arthurSuggestions,
      spongebobSuggestions,
      shortcutsSuggestions,
    ],
    onChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic mention input component that supports @mentions. Type "@" to see the autocomplete suggestions.',
      },
    },
  },
};

export const DynamicItems: Story = {
  args: {
    mentions: [],
    onChange: fn(),
  },
  render: () => {
    const [dynamicItems, setDynamicItems] = useState<MentionInputTriggerItem[]>([
      { value: 'Initial Item 1', label: 'Initial Item 1' },
      { value: 'Initial Item 2', label: 'Initial Item 2' },
    ]);
    const mentionInputRef = useRef<MentionInputRef>(null);
    const currentItemsRef = useRef(dynamicItems);

    // Always keep the ref updated with the latest items
    currentItemsRef.current = dynamicItems;

    const addRandomItem = () => {
      const randomNames = [
        'Alice Johnson',
        'Bob Smith',
        'Charlie Brown',
        'Diana Prince',
        'Edward Norton',
        'Fiona Apple',
        'George Lucas',
        'Helen Hunt',
        'Ivan Drago',
        'Julia Roberts',
        'Kevin Hart',
        'Linda Carter',
      ];

      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
      const randomId = Math.random().toString(36).substring(7);

      const newItem: MentionInputTriggerItem = {
        value: `${randomName}-${randomId}`,
        label: (
          <span className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-semibold">
              {randomName.charAt(0)}
            </div>
            <span>{randomName}</span>
          </span>
        ),
        pillLabel: randomName,
      };

      setDynamicItems((prev) => [...prev, newItem]);
    };

    const addMentionToInput = () => {
      if (mentionInputRef.current && dynamicItems.length > 0) {
        const randomItem = dynamicItems[Math.floor(Math.random() * dynamicItems.length)];
        // Only process if it's an actual item (not a separator or group)
        if ('value' in randomItem && 'label' in randomItem) {
          mentionInputRef.current.addMentionToInput({
            value: randomItem.value,
            label: randomItem.label,
            pillLabel: 'pillLabel' in randomItem ? randomItem.pillLabel : undefined,
            trigger: '!',
          });
        }
      }
    };

    const clearItems = () => {
      setDynamicItems([]);
    };

    // Create a stable function that always uses the current items from the ref
    const dynamicSuggestions = useMemo(
      () =>
        createMentionSuggestionExtension({
          trigger: '!',
          items: ({ query, defaultQueryMentionsFilter }) => {
            const latestItems = currentItemsRef.current;
            return defaultQueryMentionsFilter(query, latestItems);
          },
          pillStyling: {
            className: () => {
              return 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300 text-purple-700 hover:from-purple-200 hover:to-pink-200';
            },
          },
          popoverContent: (props) => {
            return (
              <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-800">Dynamic Item</h4>
                <p className="text-sm text-purple-600 mt-1">Value: {props.value}</p>
              </div>
            );
          },
        }),
      [dynamicItems] // Empty dependency array since we're using the ref for fresh data
    );

    return (
      <div className="space-y-4 w-full max-w-2xl">
        <MentionInput
          ref={mentionInputRef}
          className="min-w-64 p-3 border border-gray-200 rounded-lg"
          placeholder="Type ! to see dynamic mentions..."
          mentions={[dynamicSuggestions]}
          onChange={(value) => {
            console.info('Input changed:', value);
          }}
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={addRandomItem}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Add Random Item ({dynamicItems.length} items)
          </button>

          <button
            onClick={addMentionToInput}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:bg-gray-400"
            disabled={dynamicItems.length === 0}
          >
            Insert Random Mention
          </button>

          <button
            onClick={clearItems}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Clear All Items
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <p>
            <strong>Instructions:</strong>
          </p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Type "!" in the input to trigger the dynamic mention suggestions</li>
            <li>Use "Add Random Item" to add new items to the mention list</li>
            <li>Use "Insert Random Mention" to programmatically add a mention to the input</li>
            <li>Watch how the mention count updates as you add/remove items</li>
          </ul>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive story demonstrating dynamic mention items. You can add items to the mention list dynamically and insert mentions programmatically using the component ref.',
      },
    },
  },
};
