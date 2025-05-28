'use client';

import type React from 'react';
import { useRef } from 'react';
import { InputTextAreaButton } from '@/components/ui/inputs/InputTextAreaButton';
import { useBusterNewChatContextSelector } from '@/context/Chats';
import { inputHasText } from '@/lib/text';
import { useMemoizedFn, useMount } from '@/hooks';
import { type ChangeEvent, useMemo, useState } from 'react';
import { useGetDatasets } from '@/api/buster_rest';
import { NewChatWarning } from './NewChatWarning';
import { useNewChatWarning } from './useNewChatWarning';

const autoResizeConfig = {
  minRows: 3,
  maxRows: 18
};

export const NewChatInput: React.FC<{}> = () => {
  const onStartNewChat = useBusterNewChatContextSelector((state) => state.onStartNewChat);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const disabledSubmit = useMemo(() => {
    return !inputHasText(inputValue);
  }, [inputValue]);

  const onSubmit = useMemoizedFn(async (value: string) => {
    if (disabledSubmit) return;
    try {
      setLoading(true);
      await onStartNewChat({ prompt: value });
    } catch (error) {
      setLoading(false);
    }
  });

  const onStop = useMemoizedFn(() => {
    setLoading(false);
    textAreaRef.current?.focus();
    textAreaRef.current?.select();
  });

  const onChange = useMemoizedFn((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  });

  useMount(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  });

  return (
    <>
      <InputTextAreaButton
        className={'transition-all duration-300 hover:shadow-lg active:shadow-md'}
        placeholder="Ask Buster a question..."
        autoResize={autoResizeConfig}
        onSubmit={onSubmit}
        onChange={onChange}
        onStop={onStop}
        loading={loading}
        disabled={false}
        disabledSubmit={disabledSubmit}
        autoFocus
        ref={textAreaRef}
      />
    </>
  );
};
