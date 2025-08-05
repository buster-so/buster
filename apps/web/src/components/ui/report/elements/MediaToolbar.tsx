'use client';

import * as React from 'react';

import type { WithRequiredKey } from 'platejs';

import {
  FloatingMedia as FloatingMediaPrimitive,
  FloatingMediaStore,
  useFloatingMediaValue,
  useImagePreviewValue
} from '@platejs/media/react';
import { cva } from 'class-variance-authority';
import {
  useEditorRef,
  useEditorSelector,
  useElement,
  useReadOnly,
  useRemoveNodeButton,
  useSelected
} from 'platejs/react';
import { NodeTypeIcons } from '../config/icons';
import { NodeTypeLabels } from '../config/labels';

import { Button, buttonVariants } from '@/components/ui/buttons';
import { PopoverBase, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

import { CaptionButton } from './CaptionNode';

const inputVariants = cva(
  'flex h-[28px] w-full rounded-md border-none bg-transparent px-1.5 py-1 text-base placeholder:text-muted-foreground focus-visible:ring-transparent focus-visible:outline-none md:text-sm'
);

export function MediaToolbar({
  children,
  plugin
}: {
  children: React.ReactNode;
  plugin: WithRequiredKey;
}) {
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const selected = useSelected();

  const selectionCollapsed = useEditorSelector((editor) => !editor.api.isExpanded(), []);
  const isImagePreviewOpen = useImagePreviewValue('isOpen', editor.id);
  const isOpen = !readOnly && selected && selectionCollapsed && !isImagePreviewOpen;
  const isEditing = useFloatingMediaValue('isEditing');

  React.useEffect(() => {
    if (!isOpen && isEditing) {
      FloatingMediaStore.set('isEditing', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const element = useElement();
  const { props: buttonProps } = useRemoveNodeButton({ element });

  if (readOnly) return <>{children}</>;

  return (
    <PopoverBase open={isOpen} modal={false}>
      <PopoverAnchor>{children}</PopoverAnchor>

      <PopoverContent className="w-auto p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
        {isEditing ? (
          <div className="flex w-[330px] flex-col">
            <div className="flex items-center">
              <div className="text-muted-foreground flex items-center pr-1 pl-2">
                <div className="size-4">
                  <NodeTypeIcons.linkIcon />
                </div>
              </div>

              <FloatingMediaPrimitive.UrlInput
                className={inputVariants()}
                placeholder={NodeTypeLabels.pasteEmbedLink.label}
                options={{ plugin }}
              />
            </div>
          </div>
        ) : (
          <div className="box-content flex items-center">
            <FloatingMediaPrimitive.EditButton className={buttonVariants({ variant: 'ghost' })}>
              {NodeTypeLabels.editLink.label}
            </FloatingMediaPrimitive.EditButton>

            <CaptionButton variant="ghost">{NodeTypeLabels.caption.label}</CaptionButton>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button prefix={<NodeTypeIcons.trash />} variant="ghost" {...buttonProps}></Button>
          </div>
        )}
      </PopoverContent>
    </PopoverBase>
  );
}
