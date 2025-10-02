import type { ListShortcutsResponse, Shortcut } from '@buster/server-shared/shortcuts';
import { useNavigate } from '@tanstack/react-router';
import React, { useState } from 'react';
import { useDeleteShortcut, useListShortcuts } from '@/api/buster_rest/shortcuts/queryRequests';
import { NewShortcutModal } from '@/components/features/modals/NewShortcutModal';
import { Button } from '@/components/ui/buttons';
import { ButtonDropdown } from '@/components/ui/buttons/ButtonDropdown';
import { Dropdown } from '@/components/ui/dropdown';
import { Dots, Magnifier, Pencil, Plus, Trash } from '@/components/ui/icons';
import { Input } from '@/components/ui/inputs';
import { Paragraph, Text, Title } from '@/components/ui/typography';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/classMerge';

export const ShortcutsController: React.FC<{
  shortcutId?: string;
}> = ({ shortcutId }) => {
  return (
    <div className="flex flex-col space-y-5">
      <TitleAndDescription />
      <div className="border-b w-full" />
      <ShortcutsListContainer shortcutId={shortcutId} />
    </div>
  );
};

const TitleAndDescription = () => {
  return (
    <div className="flex flex-col space-y-1.5">
      <Title as="h3">Shortcuts</Title>
      <Title variant={'secondary'} as="h4" className="font-normal">
        Use shortcuts for your repeatable workflows in Buster
      </Title>
    </div>
  );
};

const stableShortcutsSelector = (data: ListShortcutsResponse) => data.shortcuts;
const ShortcutsListContainer: React.FC<{
  shortcutId?: string;
}> = ({ shortcutId }) => {
  const { data: shortcuts } = useListShortcuts({
    select: stableShortcutsSelector,
  });
  const navigate = useNavigate();

  const [isNewShortcutModalOpen, setIsNewShortcutModalOpen] = useState(false);
  const [editShortcutId, setEditShortcutId] = useState<string | undefined>(shortcutId);

  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: shortcuts,
    searchPredicate: (shortcut, searchText) => {
      return (
        shortcut.name.toLowerCase().includes(searchText) ||
        shortcut.instructions?.toLowerCase().includes(searchText)
      );
    },
  });

  const onCloseNewShortcutModal = useMemoizedFn(() => {
    setIsNewShortcutModalOpen(false);
    setTimeout(() => {
      setEditShortcutId(undefined);
      navigate({
        to: '.',
        search: {
          shortcut_id: undefined,
        },
        replace: true,
      });
    }, 250);
  });

  const onOpenEditShortcutModal = useMemoizedFn((shortcutId: string) => {
    setEditShortcutId(shortcutId);
    setIsNewShortcutModalOpen(true);
  });

  return (
    <React.Fragment>
      <div className="rounded bg-background border">
        <div className={cn('px-4 py-3.5 border-b flex items-center justify-between')}>
          <Input
            prefix={<Magnifier />}
            value={searchText}
            className="w-[250px]"
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search shortcuts by name"
            autoFocus
          />
          <Button
            variant={'ghost'}
            prefix={<Plus />}
            onClick={() => setIsNewShortcutModalOpen(true)}
          >
            New shortcut
          </Button>
        </div>

        <ShortcutsList
          shortcuts={filteredItems}
          onOpenEditShortcutModal={onOpenEditShortcutModal}
        />
      </div>

      <NewShortcutModal
        open={isNewShortcutModalOpen}
        onClose={onCloseNewShortcutModal}
        shortcutId={editShortcutId}
      />
    </React.Fragment>
  );
};

const ShortcutsList: React.FC<{
  shortcuts: Shortcut[];
  onOpenEditShortcutModal: (shortcutId: string) => void;
}> = ({ shortcuts, onOpenEditShortcutModal }) => {
  const hasResults = shortcuts.length > 0;

  if (!hasResults) {
    return (
      <div className="px-4 py-3.5 text-center min-h-30 flex items-center justify-center">
        <Text variant="secondary">No shortcuts found</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {shortcuts.map((shortcut) => (
        <ShortcutItem
          key={shortcut.id}
          shortcut={shortcut}
          onOpenEditShortcutModal={onOpenEditShortcutModal}
        />
      ))}
    </div>
  );
};

const ShortcutItem: React.FC<{
  shortcut: Shortcut;
  onOpenEditShortcutModal: (shortcutId: string) => void;
}> = React.memo(({ shortcut, onOpenEditShortcutModal }) => {
  const { mutateAsync: deleteShortcut } = useDeleteShortcut();
  return (
    <div
      className="px-4 py-3.5 flex justify-between items-center gap-x-4 hover:bg-item-hover/25 border-b last:border-b-0 cursor-pointer"
      onClick={() => {
        onOpenEditShortcutModal(shortcut.id);
      }}
    >
      <div className="flex flex-col space-y-1">
        <Text>{shortcut.name}</Text>
        <Paragraph size={'xs'} variant={'secondary'} className="line-clamp-2">
          {shortcut.instructions}
        </Paragraph>
      </div>
      <Dropdown
        items={[
          {
            label: 'Edit shortcut',
            icon: <Pencil />,
            value: 'edit',
            onClick: () => {
              onOpenEditShortcutModal(shortcut.id);
            },
            closeOnSelect: true,
          },
          {
            label: 'Delete shortcut',
            icon: <Trash />,
            value: 'delete',
            onClick: () => {
              deleteShortcut({ id: shortcut.id });
            },
            closeOnSelect: true,
          },
        ]}
        align="end"
        side="bottom"
      >
        <Button prefix={<Dots />} variant={'ghost'} />
      </Dropdown>
    </div>
  );
});

ShortcutItem.displayName = 'ShortcutItem';
