'use client';

import * as React from 'react';

import type { TComboboxInputElement, TMentionElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { getMentionOnSelectItem } from '@platejs/mention';
import { IS_APPLE, KEYS } from 'platejs';
import { PlateElement, useFocused, useReadOnly, useSelected } from 'platejs/react';

import { cn } from '@/lib/utils';
import { useMounted } from '@/hooks/useMount';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxInput,
  InlineComboboxItem
} from './InlineCombobox';

export function MentionElement(
  props: PlateElementProps<TMentionElement> & {
    prefix?: string;
  }
) {
  const element = props.element;

  const selected = useSelected();
  const focused = useFocused();
  const mounted = useMounted();
  const readOnly = useReadOnly();

  return (
    <PlateElement
      {...props}
      className={cn(
        'bg-muted inline-block rounded-md px-1.5 py-0.5 align-baseline text-sm font-medium',
        !readOnly && 'cursor-pointer',
        selected && focused && 'ring-ring ring-2',
        element.children[0][KEYS.bold] === true && 'font-bold',
        element.children[0][KEYS.italic] === true && 'italic',
        element.children[0][KEYS.underline] === true && 'underline'
      )}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        'data-slate-value': element.value,
        draggable: true
      }}>
      {mounted && IS_APPLE ? (
        // Mac OS IME https://github.com/ianstormtaylor/slate/issues/3490
        <React.Fragment>
          {props.children}
          {props.prefix}
          {element.value}
        </React.Fragment>
      ) : (
        // Others like Android https://github.com/ianstormtaylor/slate/pull/5360
        <React.Fragment>
          {props.prefix}
          {element.value}
          {props.children}
        </React.Fragment>
      )}
    </PlateElement>
  );
}

const onSelectItem = getMentionOnSelectItem();

export function MentionInputElement(props: PlateElementProps<TComboboxInputElement>) {
  const { editor, element } = props;
  const [search, setSearch] = React.useState('');

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox
        value={search}
        element={element}
        setValue={setSearch}
        showTrigger={false}
        trigger="@">
        <span className="bg-muted ring-ring inline-block rounded-md px-1.5 py-0.5 align-baseline text-sm focus-within:ring-2">
          <InlineComboboxInput />
        </span>

        <InlineComboboxContent className="my-1.5">
          <InlineComboboxEmpty>No results</InlineComboboxEmpty>

          <InlineComboboxGroup>
            {MENTIONABLES.map((item) => (
              <InlineComboboxItem
                key={item.key}
                value={item.text}
                onClick={() => onSelectItem(editor, item, search)}>
                {item.text}
              </InlineComboboxItem>
            ))}
          </InlineComboboxGroup>
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}

const MENTIONABLES = [
  { key: '0', text: 'Aayla Secura' },
  { key: '1', text: 'Adi Gallia' },
  {
    key: '2',
    text: 'Admiral Dodd Rancit'
  },
  {
    key: '3',
    text: 'Admiral Firmus Piett'
  },
  {
    key: '4',
    text: 'Admiral Gial Ackbar'
  },
  { key: '5', text: 'Admiral Ozzel' },
  { key: '6', text: 'Admiral Raddus' },
  {
    key: '7',
    text: 'Admiral Terrinald Screed'
  },
  { key: '8', text: 'Admiral Trench' },
  {
    key: '9',
    text: 'Admiral U.O. Statura'
  },
  { key: '10', text: 'Agen Kolar' },
  { key: '11', text: 'Agent Kallus' },
  {
    key: '12',
    text: 'Aiolin and Morit Astarte'
  },
  { key: '13', text: 'Aks Moe' },
  { key: '14', text: 'Almec' },
  { key: '15', text: 'Alton Kastle' },
  { key: '16', text: 'Amee' },
  { key: '17', text: 'AP-5' },
  { key: '18', text: 'Armitage Hux' },
  { key: '19', text: 'Artoo' },
  { key: '20', text: 'Arvel Crynyd' },
  { key: '21', text: 'Asajj Ventress' },
  { key: '22', text: 'Aurra Sing' },
  { key: '23', text: 'AZI-3' },
  { key: '24', text: 'Bala-Tik' },
  { key: '25', text: 'Barada' },
  { key: '26', text: 'Bargwill Tomder' },
  { key: '27', text: 'Baron Papanoida' },
  { key: '28', text: 'Barriss Offee' },
  { key: '29', text: 'Baze Malbus' },
  { key: '30', text: 'Bazine Netal' },
  { key: '31', text: 'BB-8' },
  { key: '32', text: 'BB-9E' },
  { key: '33', text: 'Ben Quadinaros' },
  { key: '34', text: 'Berch Teller' },
  { key: '35', text: 'Beru Lars' },
  { key: '36', text: 'Bib Fortuna' },
  {
    key: '37',
    text: 'Biggs Darklighter'
  },
  { key: '38', text: 'Black Krrsantan' },
  { key: '39', text: 'Bo-Katan Kryze' },
  { key: '40', text: 'Boba Fett' },
  { key: '41', text: 'Bobbajo' },
  { key: '42', text: 'Bodhi Rook' },
  { key: '43', text: 'Borvo the Hutt' },
  { key: '44', text: 'Boss Nass' },
  { key: '45', text: 'Bossk' },
  {
    key: '46',
    text: 'Breha Antilles-Organa'
  },
  { key: '47', text: 'Bren Derlin' },
  { key: '48', text: 'Brendol Hux' },
  { key: '49', text: 'BT-1' }
];
