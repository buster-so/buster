'use client';

import * as React from 'react';

import { AIChatPlugin } from '@platejs/ai/react';
import {
  BLOCK_CONTEXT_MENU_ID,
  BlockMenuPlugin,
  BlockSelectionPlugin
} from '@platejs/selection/react';
import { KEYS } from 'platejs';
import { useEditorPlugin, usePlateState } from 'platejs/react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger
} from '@/components/ui/context-menu';
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice';
import { THEME_RESET_STYLE } from '@/styles/theme-reset';
import { NodeTypeIcons } from '../config/icons';
import { NodeTypeLabels } from '../config/labels';

// Helper function to render menu item content
const MenuItemContent = ({
  icon,
  labelKey
}: {
  icon: React.ComponentType;
  labelKey: keyof typeof NodeTypeLabels;
}) => {
  const label = NodeTypeLabels[labelKey];
  const Icon = icon;
  return (
    <>
      <div className="text-icon-color text-md size-4">
        <Icon />
      </div>
      {label.label}
      {label.keyboard && <ContextMenuShortcut>{label.keyboard}</ContextMenuShortcut>}
    </>
  );
};

type Value = 'askAI' | null;

function BlockContextMenuComponent({ children }: { children: React.ReactNode }) {
  const { api, editor } = useEditorPlugin(BlockMenuPlugin);
  const [value, setValue] = React.useState<Value>(null);
  const isTouch = useIsTouchDevice();
  const [readOnly] = usePlateState('readOnly');

  const handleTurnInto = React.useCallback(
    (type: string) => {
      editor
        .getApi(BlockSelectionPlugin)
        .blockSelection.getNodes()
        .forEach(([node, path]) => {
          if (node[KEYS.listType]) {
            editor.tf.unsetNodes([KEYS.listType, 'indent'], {
              at: path
            });
          }

          editor.tf.toggleBlock(type, { at: path });
        });
    },
    [editor]
  );

  const handleAlign = React.useCallback(
    (align: 'center' | 'left' | 'right') => {
      editor.getTransforms(BlockSelectionPlugin).blockSelection.setNodes({ align });
    },
    [editor]
  );

  if (isTouch) {
    return children;
  }

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) {
          // prevent unselect the block selection
          setTimeout(() => {
            api.blockMenu.hide();
          }, 0);
        }
      }}
      modal={false}>
      <ContextMenuTrigger
        asChild
        onContextMenu={(event) => {
          const dataset = (event.target as HTMLElement).dataset;
          const disabled =
            dataset?.slateEditor === 'true' ||
            readOnly ||
            dataset?.plateOpenContextMenu === 'false';

          if (disabled) return event.preventDefault();

          api.blockMenu.show(BLOCK_CONTEXT_MENU_ID, {
            x: event.clientX,
            y: event.clientY
          });
        }}>
        <div className="block-context-menu-trigger">{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent
        className="w-64"
        style={THEME_RESET_STYLE}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.getApi(BlockSelectionPlugin).blockSelection.focus();

          if (value === 'askAI') {
            editor.getApi(AIChatPlugin).aiChat.show();
          }

          setValue(null);
        }}>
        <ContextMenuGroup>
          {/* <ContextMenuItem
            onClick={() => {
              setValue('askAI');
            }}>
            <MenuItemContent icon={NodeTypeIcons.ai} labelKey="askAI" />
          </ContextMenuItem> */}
          <ContextMenuItem
            onClick={() => {
              editor.getTransforms(BlockSelectionPlugin).blockSelection.removeNodes();
              editor.tf.focus();
            }}>
            <MenuItemContent icon={NodeTypeIcons.trash} labelKey="delete" />
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              editor.getTransforms(BlockSelectionPlugin).blockSelection.duplicate();
            }}>
            <MenuItemContent icon={NodeTypeIcons.copy} labelKey="duplicate" />
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <MenuItemContent icon={NodeTypeIcons.turnInto} labelKey="turnInto" />
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem onClick={() => handleTurnInto(KEYS.p)}>
                <MenuItemContent icon={NodeTypeIcons.paragraph} labelKey="paragraph" />
              </ContextMenuItem>

              <ContextMenuItem onClick={() => handleTurnInto(KEYS.h1)}>
                <MenuItemContent icon={NodeTypeIcons.h1} labelKey="h1" />
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleTurnInto(KEYS.h2)}>
                <MenuItemContent icon={NodeTypeIcons.h2} labelKey="h2" />
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleTurnInto(KEYS.h3)}>
                <MenuItemContent icon={NodeTypeIcons.h3} labelKey="h3" />
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleTurnInto(KEYS.blockquote)}>
                <MenuItemContent icon={NodeTypeIcons.quote} labelKey="blockquote" />
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>

        <ContextMenuGroup>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <MenuItemContent icon={NodeTypeIcons.indent} labelKey="indentation" />
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem
                onClick={() =>
                  editor.getTransforms(BlockSelectionPlugin).blockSelection.setIndent(1)
                }>
                <MenuItemContent icon={NodeTypeIcons.indent} labelKey="indent" />
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() =>
                  editor.getTransforms(BlockSelectionPlugin).blockSelection.setIndent(-1)
                }>
                <MenuItemContent icon={NodeTypeIcons.outdent} labelKey="outdent" />
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <MenuItemContent icon={NodeTypeIcons.alignLeft} labelKey="align" />
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem onClick={() => handleAlign('left')}>
                <MenuItemContent icon={NodeTypeIcons.alignLeft} labelKey="alignLeft" />
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleAlign('center')}>
                <MenuItemContent icon={NodeTypeIcons.alignCenter} labelKey="alignCenter" />
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleAlign('right')}>
                <MenuItemContent icon={NodeTypeIcons.alignRight} labelKey="alignRight" />
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const BlockContextMenu = React.memo(BlockContextMenuComponent);
