import type React from 'react';
import { useEffect, useMemo } from 'react';
import { CircleCheck, CircleXmark } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography';
import { isValidEmail } from '@/lib/email';

const PasswordCheckItem: React.FC<{
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

export const PolicyCheck: React.FC<{
  email: string;
  password: string;
  password2: string | undefined;
  onChangePolicyCheck: (passed: boolean) => void;
}> = ({ email, password, password2, onChangePolicyCheck }) => {
  const items = useMemo(() => {
    const containsNumber = /\d/;
    const containsSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/;
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
      passwordLengthCheck,
    };

    const items = [
      {
        text: 'Email is valid',
        check: isValidEmail(email),
      },
      {
        text: 'Contains a number',
        check: passwordGood.numberCheck,
      },
      {
        text: 'Contains a special character',
        check: passwordGood.specialCharCheck,
      },
      {
        text: 'Contains an uppercase letter',
        check: passwordGood.uppercaseCheck,
      },
      {
        text: 'Contains a lowercase letter',
        check: passwordGood.lowercaseCheck,
      },
      {
        text: 'Is at least 8 characters long',
        check: passwordGood.passwordLengthCheck,
      },
      {
        text: 'Passwords match',
        check: (password && password === password2) || password2 === undefined,
      },
    ];

    return items;
  }, [password, email, password2]);

  const percentageCompleted = useMemo(() => {
    const numberOfChecks = items.length;
    const numberOfChecksCompleted = items.filter((item) => item.check).length;
    return (numberOfChecksCompleted / numberOfChecks) * 100;
  }, [items]);

  useEffect(() => {
    onChangePolicyCheck(percentageCompleted === 100);
  }, [percentageCompleted, onChangePolicyCheck]);

  return (
    <div className="animate-in fade-in-0 flex flex-col gap-y-1 duration-300">
      <div className="mx-1.5 h-1 rounded-full bg-gray-200">
        <div
          className="bg-primary h-1 rounded-full transition-all duration-300"
          style={{ width: `${percentageCompleted}%` }}
        />
      </div>
      <div className="flex flex-col gap-y-1 p-1.5">
        {items.map((item, index) => (
          <PasswordCheckItem
            key={`${item.text}-${index}`}
            passwordGood={item.check}
            text={item.text}
          />
        ))}
      </div>
    </div>
  );
};
