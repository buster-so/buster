import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal, Input, InputRef, ConfigProvider, Divider, ThemeConfig } from 'antd';
import { AppMaterialIcons } from '@/components';
import { useMemoizedFn, useMount, useThrottleFn } from 'ahooks';
import { useAntToken } from '@/styles/useAntToken';
import { useBusterNewThreadsContextSelector } from '@/context/Threads';
import { inputHasText } from '@/utils';
import { useBusterSearchContextSelector } from '@/context/Search';
import { BusterSearchResult } from '@/api/buster_rest';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { NewThreadModalDataSourceSelect } from './NewThreadModalDatasourceSelect';
import { SuggestedPromptsContainer } from './SuggestedPromptsContainer';
import { NoDatasets } from './NoDatasets';
import { useParams } from 'next/navigation';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import { useGetDatasets } from '@/api/buster_rest/datasets';

const themeConfig: ThemeConfig = {
  components: {
    Modal: {
      paddingMD: 4,
      paddingContentHorizontalLG: 4
    }
  }
};

const modalClassNames = {
  body: '!p-0'
};

export const NewThreadModal = React.memo<{
  open: boolean;
  onClose: () => void;
}>(({ open, onClose }) => {
  const searchParams = useParams();
  const threadId: string | undefined = searchParams.threadId as string;
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const { openErrorNotification } = useBusterNotifications();
  const { isFetched: isFetchedDatasets, data: datasetsList } = useGetDatasets();
  const onSetSelectedThreadDataSource = useBusterNewThreadsContextSelector(
    (x) => x.onSetSelectedThreadDataSource
  );
  const selectedThreadDataSource = useBusterNewThreadsContextSelector(
    (x) => x.selectedThreadDataSource
  );
  const onStartNewThread = useBusterNewThreadsContextSelector((x) => x.onStartNewThread);
  const onSetPrompt = useBusterNewThreadsContextSelector((x) => x.onSetPrompt);
  const prompt = useBusterNewThreadsContextSelector((x) => x.prompt);
  const onBusterSearch = useBusterSearchContextSelector((x) => x.onBusterSearch);
  const token = useAntToken();
  const [suggestedPrompts, setSuggestedPrompts] = useState<BusterSearchResult[]>([]);
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [defaultSuggestedPrompts, setDefaultSuggestedPrompts] = useState<BusterSearchResult[]>([]);
  const shownPrompts = prompt.length > 1 ? suggestedPrompts : defaultSuggestedPrompts;
  const lastKeyPressed = useRef<string | null>(null);
  const hasDatasets = datasetsList.length > 0 && isFetchedDatasets;
  const showSuggested = shownPrompts.length > 0 && hasDatasets;
  const [navigatingToThreadId, setNavigatingToThreadId] = useState<string | null>(null);

  const memoizedHasDatasetStyle = useMemo(() => {
    return {
      padding: `${token.paddingSM}px ${token.paddingSM}px`,
      paddingTop: token.paddingSM,
      paddingBottom: 0
    };
  }, []);

  const getSuggestedThreadPrompts = useMemoizedFn(async (prompt: string) => {
    const res = await onBusterSearch({
      query: prompt,
      include: ['exclude_threads']
    });
    return res;
  });

  const { run: debouncedGetSuggestedThreadPrompts } = useThrottleFn(
    async (v: string) => {
      try {
        const prompts = await getSuggestedThreadPrompts(v);
        setSuggestedPrompts(prompts);
        return prompts;
      } catch (e) {
        openErrorNotification(e);
      }
    },
    { wait: 350 }
  );

  const onSetPromptAndAsk = useMemoizedFn(({ name, id }: BusterSearchResult) => {
    onStartNewThread(name);
  });

  const onSelectPrompt = useMemoizedFn(({ name, id }: BusterSearchResult) => {
    if (id !== threadId) {
      onChangePage({
        route: BusterRoutes.APP_THREAD_ID,
        threadId: id
      });
      setNavigatingToThreadId(id);
    } else {
      onClose();
    }
  });

  const getDefaultSuggestedPrompts = useMemoizedFn(() => {
    getSuggestedThreadPrompts('').then((prompts) => {
      setDefaultSuggestedPrompts(prompts);
    });
  });

  const onCloseOrCancel = useMemoizedFn(() => {
    onClose();
  });

  useEffect(() => {
    if (open) {
      onSetPrompt('');
      setNavigatingToThreadId(null);

      if (defaultSuggestedPrompts.length === 0) {
        getDefaultSuggestedPrompts();
      }

      const handleKeyPress = (event: KeyboardEvent) => {
        lastKeyPressed.current = event.code;
      };
      document.addEventListener('keydown', handleKeyPress);

      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [open]);

  return (
    <ConfigProvider theme={themeConfig}>
      <Modal
        open={open}
        onCancel={onCloseOrCancel}
        closable={false}
        onClose={onCloseOrCancel}
        width={hasDatasets ? 725 : 350}
        destroyOnClose={true}
        footer={null}
        classNames={modalClassNames}>
        {hasDatasets && (
          <div className="flex w-full flex-col" style={memoizedHasDatasetStyle}>
            <NewThreadModalDataSourceSelect
              onSetSelectedThreadDataSource={onSetSelectedThreadDataSource}
              selectedThreadDataSource={selectedThreadDataSource}
              dataSources={datasetsList}
              loading={!isFetchedDatasets}
            />

            <NewThreadInput
              setSuggestedPrompts={setSuggestedPrompts}
              debouncedGetSuggestedThreadPrompts={debouncedGetSuggestedThreadPrompts}
              shownPrompts={shownPrompts}
              lastKeyPressed={lastKeyPressed}
              activeItem={activeItem}
            />
          </div>
        )}

        {!hasDatasets && <NoDatasets onClose={onClose} />}

        {hasDatasets && showSuggested && <Divider className="!m-0" />}

        {hasDatasets && (
          <SuggestedPromptsContainer
            open={open}
            activeItem={activeItem}
            setActiveItem={setActiveItem}
            prompts={shownPrompts}
            onSelectPrompt={onSelectPrompt}
            navigatingToThreadId={navigatingToThreadId}
          />
        )}
      </Modal>
    </ConfigProvider>
  );
});
NewThreadModal.displayName = 'NewThreadModal';

const NewThreadInput: React.FC<{
  setSuggestedPrompts: (prompts: BusterSearchResult[]) => void;
  debouncedGetSuggestedThreadPrompts: (prompt: string) => Promise<BusterSearchResult[] | undefined>;
  shownPrompts: BusterSearchResult[];
  lastKeyPressed: React.MutableRefObject<string | null>;
  activeItem: number | null;
}> = React.memo(
  ({
    setSuggestedPrompts,
    debouncedGetSuggestedThreadPrompts,
    activeItem,
    shownPrompts,
    lastKeyPressed
  }) => {
    const token = useAntToken();
    const inputRef = useRef<InputRef>(null);
    const loadingNewThread = useBusterNewThreadsContextSelector((x) => x.loadingNewThread);
    const prompt = useBusterNewThreadsContextSelector((x) => x.prompt);
    const onStartNewThread = useBusterNewThreadsContextSelector((x) => x.onStartNewThread);
    const onSetPrompt = useBusterNewThreadsContextSelector((x) => x.onSetPrompt);

    const onChangeText = useMemoizedFn((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.currentTarget.value;
      onSetPrompt(value);
      if (value.length < 1) {
        setSuggestedPrompts([]);
      } else {
        debouncedGetSuggestedThreadPrompts(e.currentTarget.value);
      }
    });

    const onPressEnter = useMemoizedFn((v: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const value = v.currentTarget.value;
      const lastKeyPressedWasUpOrDown =
        lastKeyPressed.current === 'ArrowUp' || lastKeyPressed.current === 'ArrowDown';

      if (
        typeof activeItem === 'number' &&
        shownPrompts[activeItem]?.name &&
        lastKeyPressedWasUpOrDown
      ) {
        onStartNewThread(shownPrompts[activeItem]?.name);
        v.stopPropagation();
        v.preventDefault();
        return;
      }
      if (v.shiftKey) {
        return;
      }
      onStartNewThread(value);
    });

    const onClickSubmitButton = useMemoizedFn(() => {
      onStartNewThread(prompt);
    });

    useMount(() => {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    });

    const autoSizeMemoized = useMemo(() => {
      return { minRows: 1, maxRows: 16 };
    }, []);

    return (
      <div className="flex min-h-[54px] items-center justify-between space-x-1 overflow-y-auto px-2">
        <Input.TextArea
          ref={inputRef}
          size="large"
          className="w-full !pl-0"
          autoSize={autoSizeMemoized}
          disabled={loadingNewThread}
          variant="borderless"
          placeholder="Search for a metric..."
          value={prompt}
          onChange={onChangeText}
          onPressEnter={onPressEnter}
        />
        <Button
          type="primary"
          size="middle"
          icon={<AppMaterialIcons icon="arrow_forward" size={token.fontSizeLG} />}
          loading={loadingNewThread}
          disabled={!inputHasText(prompt)}
          onClick={onClickSubmitButton}
        />
      </div>
    );
  }
);
NewThreadInput.displayName = 'NewThreadInput';
