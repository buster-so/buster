import { CircleCheck, CircleXmark, CircleInfo } from '@/components/ui/icons';
import React, { useEffect, useMemo } from 'react';
import { Text } from '@/components/ui/typography';
import { Popover, PopoverProps } from '@/components/ui/tooltip/Popover';
import { Button } from '@/components/ui/buttons/Button';

export const PolicyCheck: React.FC<{
  password: string;
  show: boolean;
  onCheckChange?: (value: boolean) => void;
  children?: React.ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}> = ({ password, show, onCheckChange, children, placement = 'left' }) => {
  const items = useMemo(() => {
    const containsNumber = /\d/;
    const containsSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    const containsUppercase = /[A-Z]/;
    const containsLowercase = /[a-z]/;

    const numberCheck = containsNumber.test(password);
    const specialCharCheck = containsSpecialChar.test(password);
    const uppercaseCheck = containsUppercase.test(password);
    const lowercaseCheck = containsLowercase.test(password);
    const passwordLengthCheck = password.length >= 8;

    const passwordGood = {
      numberCheck,
      specialCharCheck,
      uppercaseCheck,
      lowercaseCheck,
      passwordLengthCheck
    };

    const items = [
      {
        text: 'Contains a number',
        check: passwordGood.numberCheck
      },
      {
        text: 'Contains a special character',
        check: passwordGood.specialCharCheck
      },
      {
        text: 'Contains an uppercase letter',
        check: passwordGood.uppercaseCheck
      },
      {
        text: 'Contains a lowercase letter',
        check: passwordGood.lowercaseCheck
      },
      {
        text: 'Is at least 8 characters long',
        check: passwordGood.passwordLengthCheck
      }
    ];

    return items;
  }, [password]);

  const allCompleted = useMemo(() => {
    return items.every((item) => item.check);
  }, [items]);

  useEffect(() => {
    if (show && onCheckChange) {
      onCheckChange(allCompleted);
    }
  }, [show, allCompleted, onCheckChange]);

  const PasswordCheck: React.FC<{
    passwordGood: boolean;
    text: string;
  }> = ({ passwordGood, text }) => {
    return (
      <div className="flex items-center space-x-1">
        {passwordGood ? (
          <div className="text-success-foreground">
            <CircleCheck />
          </div>
        ) : (
          <div className="text-danger-foreground">
            <CircleXmark />
          </div>
        )}
        <Text size="sm">{text}</Text>
      </div>
    );
  };

  const sideMemo: PopoverProps['side'] = useMemo(() => {
    switch (placement) {
      case 'top':
        return 'top';
      case 'right':
        return 'right';
      case 'bottom':
        return 'bottom';
      case 'left':
        return 'left';
    }
  }, [placement]);

  const alignMemo: PopoverProps['align'] = useMemo(() => {
    switch (placement) {
      case 'top':
        return 'start';
      case 'right':
        return 'end';
      case 'bottom':
        return 'start';
      case 'left':
        return 'end';
    }
  }, [placement]);

  if (!show) return children;

  return (
    <Popover
      side={sideMemo}
      align={alignMemo}
      content={
        <div className="flex flex-col gap-y-1 p-1.5">
          {items.map((item, index) => (
            <PasswordCheck key={index} passwordGood={item.check} text={item.text} />
          ))}
        </div>
      }>
      {!children ? (
        <Button
          variant={'ghost'}
          type="button"
          size={'small'}
          prefix={allCompleted ? <CircleCheck /> : <CircleInfo />}></Button>
      ) : (
        children
      )}
    </Popover>
  );
};
