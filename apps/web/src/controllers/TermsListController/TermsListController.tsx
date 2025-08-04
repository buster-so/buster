'use client';

import React, { useMemo, useState } from 'react';
import type { BusterTermListItem } from '@/api/asset_interfaces/terms';
import { useGetTermsList } from '@/api/buster_rest/terms';
import { Avatar } from '@/components/ui/avatar';
import {
  BusterList,
  type BusterListColumn,
  type BusterListRowItem,
  ListEmptyStateWithButton
} from '@/components/ui/list';
import { useUserConfigContextSelector } from '@/context/Users';
import { useMemoizedFn } from '@/hooks';
import { formatDate } from '@/lib/date';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { TermListSelectedOptionPopup } from './TermListSelectedPopup';

const columns: BusterListColumn<BusterTermListItem>[] = [
  {
    dataIndex: 'name',
    title: 'Term'
  },
  {
    dataIndex: 'last_edited',
    title: 'Last edited',
    width: 140,
    render: (data) => formatDate({ date: data, format: 'lll' })
  },
  {
    dataIndex: 'last_edited',
    title: 'Last edited',
    width: 140,
    render: (data) => formatDate({ date: data, format: 'lll' })
  },
  {
    dataIndex: 'created_by',
    title: 'Owner',
    width: 60,
    render: (_, data: BusterTermListItem) => <Avatar name={data.created_by.name} size={18} />
  }
];

export const TermsListController: React.FC<{
  setOpenNewTermsModal: (open: boolean) => void;
}> = React.memo(({ setOpenNewTermsModal }) => {
  const { data: termsList, isFetched: isFetchedTermsList } = useGetTermsList();
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);

  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([]);

  const rows: BusterListRowItem<BusterTermListItem>[] = useMemo(() => {
    return termsList.map((term) => ({
      id: term.id,
      data: term,
      link: createBusterRoute({
        route: BusterRoutes.APP_TERMS_ID,
        termId: term.id
      })
    }));
  }, [termsList]);

  const onOpenNewTermModal = useMemoizedFn(() => {
    setOpenNewTermsModal(true);
  });

  return (
    <>
      <BusterList
        rows={rows}
        columns={columns}
        selectedRowKeys={selectedTermIds}
        onSelectChange={setSelectedTermIds}
        emptyState={
          isFetchedTermsList ? (
            <ListEmptyStateWithButton
              isAdmin={isAdmin}
              title="You don’t have any terms yet."
              description="You don’t have any terms. As soon as you do, they will start to  appear here."
              onClick={onOpenNewTermModal}
              buttonText="New term"
            />
          ) : null
        }
      />
      <TermListSelectedOptionPopup
        selectedRowKeys={selectedTermIds}
        onSelectChange={setSelectedTermIds}
      />
    </>
  );
});

TermsListController.displayName = 'TermsListController';
