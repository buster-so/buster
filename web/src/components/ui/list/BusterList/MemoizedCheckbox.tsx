import { Checkbox } from '@/components/ui/checkbox';
import { CheckedState } from '@radix-ui/react-checkbox';
import React from 'react';

export const MemoizedCheckbox = React.memo(
  ({ checked, indeterminate }: { checked: boolean; indeterminate: boolean }) => {
    return <Checkbox checked={checked} indeterminate={indeterminate} />;
  }
);
MemoizedCheckbox.displayName = 'MemoizedCheckbox';
