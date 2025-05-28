'use client';

import type React from 'react';
import { useState } from 'react';
import { ChatItemsContainer } from './ChatItemsContainer';
import {
  type getListChats,
  type getListLogs,
  useGetListChats,
  useGetListLogs
} from '@/api/buster_rest/chats';
import { useUserConfigContextSelector } from '@/context/Users';

export const ChatListContainer: React.FC<{
  type: 'logs' | 'chats';
}> = ({ type }) => {
  const isAdmin = useUserConfigContextSelector((x) => x.isAdmin);

  if (type === 'chats' || !isAdmin) {
    return <ChatsContainer />;
  }

  return <LogsContainer />;
};

const ChatsContainer: React.FC<{}> = ({}) => {
  const [filters, setFilters] = useState<Partial<Parameters<typeof getListChats>[0]>>({});

  const { data: list, isFetched } = useGetListChats(filters);

  return <ChatItemsContainer chats={list} loading={!isFetched} type={'chats'} />;
};

const LogsContainer: React.FC<{}> = ({}) => {
  const [filters, setFilters] = useState<Partial<Parameters<typeof getListLogs>[0]>>({});

  const { data: list, isFetched } = useGetListLogs(filters);

  return <ChatItemsContainer chats={list} loading={!isFetched} type={'logs'} />;
};
