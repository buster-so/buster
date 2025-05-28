'use client';

import { Input, type InputProps } from './Input';
import React, { useState } from 'react';
import { Button } from '../buttons';
import { Eye, EyeSlash } from '../icons';

export const InputPassword = React.memo(({ ...props }: InputProps) => {
  const [visibilityToggle, setShowVisibilityToggle] = useState(false);

  return (
    <div className="relative flex w-full space-x-0.5">
      <Input
        {...props}
        value={props.value}
        onChange={props.onChange}
        type={visibilityToggle ? 'text' : 'password'}
      />

      <Button
        variant="ghost"
        size="small"
        type="button"
        className="absolute top-1/2 right-[7px] -translate-y-1/2"
        prefix={!visibilityToggle ? <Eye /> : <EyeSlash />}
        onClick={() => setShowVisibilityToggle(!visibilityToggle)}></Button>
    </div>
  );
});

InputPassword.displayName = 'InputPassword';
