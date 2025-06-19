import React from 'react';
import { Xmark } from '@/components/ui/icons';
import { PopupContainer, PopupSplitter } from '@/components/ui/popup/PopupContainer';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';

export const BusterListSelectedOptionPopupContainer: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  buttons?: React.ReactNode[];
  show?: boolean;
}> = ({ selectedRowKeys, onSelectChange, buttons = [], show: showProp }) => {
  const show = showProp ?? selectedRowKeys.length > 0;

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
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const text = `${selectedRowKeys.length} selected`;

  return (
    <div
      className={cn(
        'flex items-center',
        'bg-bg-container rounded pl-2',
        'min-h-[24px]',
        'border-border-default border border-dashed'
      )}>
      <Text>{text}</Text>

      <div className="border-border-default ml-1.5 min-h-[24px] border-l border-dashed" />

      <div
        onClick={() => {
          onSelectChange([]);
        }}
        className={cn(
          'flex cursor-pointer items-center justify-center px-1',
          'text-text-secondary hover:text-text-default transition-colors duration-200'
        )}>
        <div className="text-base">
          <Xmark />
        </div>
      </div>
    </div>
  );
};
