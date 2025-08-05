'use client';

import * as React from 'react';

import type { TLinkElement } from 'platejs';

import { type UseVirtualFloatingOptions, flip, offset } from '@platejs/floating';
import { getLinkAttributes } from '@platejs/link';
import {
  type LinkFloatingToolbarState,
  FloatingLinkUrlInput,
  useFloatingLinkEdit,
  useFloatingLinkEditState,
  useFloatingLinkInsert,
  useFloatingLinkInsertState
} from '@platejs/link/react';
import { cva } from 'class-variance-authority';
import { KEYS } from 'platejs';
import { NodeTypeIcons } from '../config/icons';
import {
  useEditorRef,
  useEditorSelection,
  useFormInputProps,
  usePluginOption
} from 'platejs/react';

import { Button } from '@/components/ui/buttons';
import { Separator } from '@/components/ui/separator';

const popoverVariants = cva(
  'z-50 w-auto rounded border bg-popover p-1 text-popover-foreground shadow-md outline-hidden'
);

const linkInputVariants = cva(
  'flex h-[28px] w-full rounded border-none bg-transparent px-1.5 py-1 text-base placeholder:text-muted-foreground focus-visible:ring-transparent focus-visible:outline-none md:text-sm'
);

export function LinkFloatingToolbar({ state }: { state?: LinkFloatingToolbarState }) {
  const activeCommentId = usePluginOption({ key: KEYS.comment }, 'activeId');
  const activeSuggestionId = usePluginOption({ key: KEYS.suggestion }, 'activeId');

  const floatingOptions: UseVirtualFloatingOptions = React.useMemo(() => {
    return {
      middleware: [
        offset(8),
        flip({
          fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
          padding: 12
        })
      ],
      placement: activeSuggestionId || activeCommentId ? 'top-start' : 'bottom-start'
    };
  }, [activeCommentId, activeSuggestionId]);

  const insertState = useFloatingLinkInsertState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions
    }
  });
  const {
    hidden,
    props: insertProps,
    ref: insertRef,
    textInputProps
  } = useFloatingLinkInsert(insertState);

  const editState = useFloatingLinkEditState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions
    }
  });
  const {
    editButtonProps,
    props: editProps,
    ref: editRef,
    unlinkButtonProps
  } = useFloatingLinkEdit(editState);

  if (hidden) return null;

  const input = <LinkEditPopoverContent textInputProps={textInputProps} />;

  const editContent = editState.isEditing ? (
    input
  ) : (
    <div className="box-content flex items-center space-x-0">
      <Button variant={'ghost'} size={'default'} {...editButtonProps}>
        Edit link
      </Button>

      <LinkOpenButton />

      <Button
        variant={'ghost'}
        size={'default'}
        prefix={<NodeTypeIcons.unlink />}
        {...unlinkButtonProps}></Button>
    </div>
  );

  return (
    <>
      <div ref={insertRef} className={popoverVariants()} {...insertProps}>
        {input}
      </div>

      <div ref={editRef} className={popoverVariants()} {...editProps}>
        {editContent}
      </div>
    </>
  );
}

function LinkOpenButton() {
  const editor = useEditorRef();
  const selection = useEditorSelection();

  const attributes = React.useMemo(
    () => {
      const entry = editor.api.node<TLinkElement>({
        match: { type: editor.getType(KEYS.link) }
      });
      if (!entry) {
        return {};
      }
      const [element] = entry;
      return getLinkAttributes(editor, element);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, selection]
  );

  return (
    <a
      {...attributes}
      onMouseOver={(e) => {
        e.stopPropagation();
      }}
      aria-label="Open link in a new tab"
      target="_blank">
      <Button variant={'ghost'} size={'default'} prefix={<NodeTypeIcons.externalLink />}></Button>
    </a>
  );
}

const LinkEditPopoverContent = ({
  textInputProps
}: {
  textInputProps: ReturnType<typeof useFloatingLinkInsert>['textInputProps'];
}) => {
  const inputProps = useFormInputProps({
    preventDefaultOnEnterKeydown: true
  });

  const inputClassName = linkInputVariants();

  return (
    <div className="flex w-[330px] flex-col" {...inputProps}>
      <div className="flex items-center">
        <div className="text-muted-foreground flex items-center pr-1 pl-2">
          <NodeTypeIcons.linkIcon />
        </div>

        <FloatingLinkUrlInput
          className={inputClassName}
          placeholder="Paste link"
          data-plate-focus
        />
      </div>
      <Separator className="my-1" />
      <div className="flex items-center">
        <div className="text-muted-foreground flex items-center pr-1 pl-2">
          <NodeTypeIcons.textLink />
        </div>

        <input
          className={inputClassName}
          placeholder="Text to display"
          data-plate-focus
          {...textInputProps}
        />
      </div>
    </div>
  );
};
