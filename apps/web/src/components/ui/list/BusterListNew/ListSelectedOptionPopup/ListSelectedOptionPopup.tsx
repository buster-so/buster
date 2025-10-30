import React from 'react';
import { Xmark } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import { PopupContainer, PopupSplitter } from '../../../popup/PopupContainer';

export const ListSelectedOptionPopupContainer: React.FC<{
  selectedRowKeys: Set<string>;
  onSelectChange: (selectedRowKeys: Set<string>) => void;
  buttons?: React.ReactNode[];
  show?: boolean;
}> = ({ selectedRowKeys, onSelectChange, buttons = [], show: showProp }) => {
  const show = showProp ?? selectedRowKeys.size > 0;

  return (
    <PopupContainer show={show}>
      <div className="flex w-full items-center space-x-2">
        <SelectedButton selectedRowKeys={selectedRowKeys} onSelectChange={onSelectChange} />

        {buttons.length > 0 && <PopupSplitter />}

        {buttons.map((button, index) => (
          <React.Fragment key={index}>{button}</React.Fragment>
        ))}
      </div>
    </PopupContainer>
  );
};

const SelectedButton: React.FC<{
  selectedRowKeys: Set<string>;
  onSelectChange: (selectedRowKeys: Set<string>) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const text = `${selectedRowKeys.size} selected`;

  return (
    <div
      className={cn(
        'flex items-center',
        'bg-bg-container rounded pl-2',
        'min-h-[24px]',
        'border-border-default border border-dashed'
      )}
    >
      <Text>{text}</Text>

      <div className="border-border-default ml-1.5 min-h-[24px] border-l border-dashed" />

      <div
        onClick={() => {
          onSelectChange(new Set([]));
        }}
        className={cn(
          'flex cursor-pointer items-center justify-center px-1',
          'text-text-secondary hover:text-text-default transition-colors duration-200'
        )}
      >
        <div className="text-base">
          <Xmark />
        </div>
      </div>
    </div>
  );
};
