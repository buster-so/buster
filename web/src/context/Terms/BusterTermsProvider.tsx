import { BusterTerm, BusterTermListItem } from '@/api/buster-rest';
import React, { useEffect } from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import { useMemoizedFn, useMount, useUnmount } from 'ahooks';
import { TermPostRequest, TermUpdateRequest } from '@/api/buster-socket/terms';
import { useBusterNotifications } from '../BusterNotifications/BusterNotifications';
import {
  createContext,
  useContextSelector,
  ContextSelector
} from '@fluentui/react-context-selector';

const useBusterTerms = () => {
  const { openConfirmModal } = useBusterNotifications();
  const busterSocket = useBusterWebSocket();
  const [termsList, setTermsList] = React.useState<BusterTermListItem[]>([]);
  const [loadedTermsList, setLoadedTermsList] = React.useState(false);
  const [openNewTermsModal, setOpenNewTermsModal] = React.useState(false);

  const onSetOpenNewTermsModal = useMemoizedFn((value: boolean) => {
    setOpenNewTermsModal(value);
  });

  const _onInitialTerms = useMemoizedFn((d: BusterTermListItem[]) => {
    setTermsList(d);
  });

  const getInitialTerms = useMemoizedFn(async () => {
    await busterSocket.emitAndOnce({
      emitEvent: {
        route: '/terms/list',
        payload: {
          page: 0,
          page_size: 100
        }
      },
      responseEvent: {
        route: '/terms/list:ListTerms',
        callback: _onInitialTerms
      }
    });
    setLoadedTermsList(true);
  });

  const getTermFromList = useMemoizedFn((termId: string) => {
    return termsList.find((term) => term.id === termId);
  });

  //individual terms
  const [terms, setTerms] = React.useState<Record<string, BusterTerm>>({});
  const subscribedTerms = React.useRef<Record<string, boolean>>({});

  const _onGetIndividualTerm = useMemoizedFn((d: BusterTerm) => {
    setTerms((prev) => ({
      ...prev,
      [d.id]: d
    }));
  });

  const subscribeToTerm = useMemoizedFn(async ({ id }: { id: string }) => {
    return busterSocket.emitAndOnce({
      emitEvent: {
        route: '/terms/get',
        payload: {
          id
        }
      },
      responseEvent: {
        route: '/terms/get:GetTerm',
        callback: _onGetIndividualTerm
      }
    });
  });

  const unsubscribeFromTerm = useMemoizedFn((termId: string) => {
    subscribedTerms.current[termId] = false;
  });

  const deleteTerm = useMemoizedFn(async ({ id }: { id: string }, ignoreConfirm = false) => {
    const method = async () => {
      setTermsList((prev) => prev.filter((term) => term.id !== id));
      return await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/terms/delete',
          payload: {
            ids: [id]
          }
        },
        responseEvent: {
          route: '/terms/delete:DeleteTerm',
          callback: () => {}
        }
      });
    };

    if (ignoreConfirm) {
      return method();
    }

    return openConfirmModal({
      title: 'Delete term',
      content: 'Are you sure you want to delete this term?',
      onOk: method
    });
  });

  const updateTerm = useMemoizedFn(async (params: TermUpdateRequest['payload']) => {
    setTerms((prev) => {
      return {
        ...prev,
        [params.id]: {
          ...prev[params.id],
          ...params
        }
      };
    });
    return await busterSocket.emitAndOnce({
      emitEvent: {
        route: '/terms/update',
        payload: params
      },
      responseEvent: {
        route: '/terms/update:UpdateTerm',
        callback: _onGetIndividualTerm
      }
    });
  });

  const createTerm = useMemoizedFn(async (params: TermPostRequest['payload']) => {
    const res = await busterSocket.emitAndOnce({
      emitEvent: {
        route: '/terms/post',
        payload: params
      },
      responseEvent: {
        route: '/terms/post:PostTerm',
        callback: _onGetIndividualTerm
      }
    });
    await getInitialTerms();
    return res;
  });

  return {
    getTermFromList,
    createTerm,
    subscribeToTerm,
    termsList,
    loadedTermsList,
    getInitialTerms,
    onSetOpenNewTermsModal,
    updateTerm,
    deleteTerm,
    openNewTermsModal,
    unsubscribeFromTerm,
    terms
  };
};

const BusterTerms = createContext<ReturnType<typeof useBusterTerms>>(
  {} as ReturnType<typeof useBusterTerms>
);

export const BusterTermsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const value = useBusterTerms();
  return <BusterTerms.Provider value={value}>{children}</BusterTerms.Provider>;
};

export const useTermsContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterTerms>, T>
) => useContextSelector(BusterTerms, selector);

export const useTermsIndividual = ({ termId }: { termId: string | undefined }) => {
  const subscribeToTerm = useTermsContextSelector((x) => x.subscribeToTerm);
  const unsubscribeFromTerm = useTermsContextSelector((x) => x.unsubscribeFromTerm);
  const term = useTermsContextSelector((x) => x.terms[termId ?? '']);

  useEffect(() => {
    if (termId) {
      subscribeToTerm({ id: termId });
    }
  }, [termId]);

  useUnmount(() => {
    if (termId) {
      unsubscribeFromTerm(termId);
    }
  });

  return { term };
};
