'use client';

import React, { ChangeEvent } from 'react';
import { Input, InputProps, InputRef } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { AppMaterialIcons } from '../icons';

interface SearchInputProps extends Omit<InputProps, 'onChange'> {
  placeholder: string;
  onChange: (value: string) => void;
}

export const SearchInput = React.forwardRef<InputRef, SearchInputProps>(
  ({ onChange, ...rest }, ref) => {
    const onChangePreflight = useMemoizedFn((e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    });
    return (
      <Input
        ref={ref}
        prefix={<AppMaterialIcons icon="search" />}
        onChange={onChangePreflight}
        {...rest}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
