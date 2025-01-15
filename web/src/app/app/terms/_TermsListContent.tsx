'use client';

import React, { useContext, useMemo, useState } from 'react';
import { AppContent } from '../_components/AppContent';
import { BusterUserAvatar } from '@/components';
import { formatDate } from '@/utils';
import { BusterList, BusterListColumn, BusterListRow } from '@/components/list';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { BusterTermListItem } from '@/api/buster-rest';
import { useMount } from 'ahooks';
import { ListEmptyState } from '../_components/Lists/ListEmptyState';
import { useUserConfigContextSelector } from '@/context/Users';
import { useTermsContextSelector } from '@/context/Terms';
import { TermListSelectedOptionPopup } from './_TermListSelectedPopup';

const columns: BusterListColumn[] = [
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
    dataIndex: 'created_at',
    title: 'Created at',
    width: 140,
    render: (data) => formatDate({ date: data, format: 'lll' })
  },
  {
    dataIndex: 'owner',
    title: 'Owner',
    width: 60,
    render: (_, data: BusterTermListItem) => (
      <BusterUserAvatar name={data.created_by.name} size={18} />
    )
  }
];

export const TermsContent: React.FC = () => {
  const loadedTermsList = useTermsContextSelector((x) => x.loadedTermsList);
  const termsList = useTermsContextSelector((x) => x.termsList);
  const getInitialTerms = useTermsContextSelector((x) => x.getInitialTerms);
  const onSetOpenNewTermsModal = useTermsContextSelector((x) => x.onSetOpenNewTermsModal);
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);

  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([]);

  const rows: BusterListRow[] = useMemo(() => {
    return termsList.map((term) => ({
      id: term.id,
      data: term,
      link: createBusterRoute({
        route: BusterRoutes.APP_TERMS_ID,
        termId: term.id
      })
    }));
  }, [termsList]);

  useMount(() => {
    getInitialTerms();
  });

  return (
    <AppContent>
      <BusterList
        rows={rows}
        columns={columns}
        selectedRowKeys={selectedTermIds}
        onSelectChange={setSelectedTermIds}
        emptyState={
          loadedTermsList ? (
            <ListEmptyState
              isAdmin={isAdmin}
              title="You don’t have any terms yet."
              description="You don’t have any terms. As soon as you do, they will start to  appear here."
              onClick={() => {
                onSetOpenNewTermsModal(true);
              }}
              buttonText="New term"
            />
          ) : (
            <></>
          )
        }
      />
      <TermListSelectedOptionPopup
        selectedRowKeys={selectedTermIds}
        onSelectChange={setSelectedTermIds}
      />
    </AppContent>
  );
};
