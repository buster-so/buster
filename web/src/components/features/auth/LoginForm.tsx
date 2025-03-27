'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/buttons';
import { Input } from '@/components/ui/inputs';
import { Title, Text } from '@/components/ui/typography';
import { inputHasText } from '@/lib/text';
import { isValidEmail } from '@/lib/email';
import { useMemoizedFn } from '@/hooks';
import Link from 'next/link';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import Google from '@/components/ui/icons/customIcons/Google';
import Microsoft from '@/components/ui/icons/customIcons/Microsoft';
import Github from '@/components/ui/icons/customIcons/Github';
import Cookies from 'js-cookie';
import { PolicyCheck } from './PolicyCheck';
import { rustErrorHandler } from '@/api/buster_rest/errors';
import { cn } from '@/lib/classMerge';
import { SuccessCard } from '@/components/ui/card/SuccessCard';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  signInWithAzure,
  signInWithEmailAndPassword,
  signInWithGithub,
  signInWithGoogle,
  signUp
} from '@/lib/supabase/signIn';

const DEFAULT_CREDENTIALS = {
  email: process.env.NEXT_PUBLIC_USER!,
  password: process.env.NEXT_PUBLIC_USER_PASSWORD!
};

export const LoginForm: React.FC<{}> = ({}) => {
  const [loading, setLoading] = useState<'google' | 'github' | 'azure' | 'email' | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [signUpFlow, setSignUpFlow] = useState(true);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const errorFallback = (error: any) => {
    const errorMessage = rustErrorHandler(error);
    if (errorMessage?.message) {
      setErrorMessages(['Invalid email or password']);
    } else {
      setErrorMessages(['An error occurred']);
    }
  };

  const onSignInWithUsernameAndPassword = useMemoizedFn(
    async ({ email, password }: { email: string; password: string }) => {
      setLoading('email');
      try {
        const res = await signInWithEmailAndPassword({ email, password });
        if (res?.error) throw res.error;
      } catch (error: any) {
        errorFallback(error);
      }
      setLoading(null);
    }
  );

  const onSignInWithGoogle = useMemoizedFn(async () => {
    setLoading('google');
    try {
      const res = await signInWithGoogle();
      if (res?.error) throw res.error;
    } catch (error: any) {
      errorFallback(error);
    }
    setLoading('google');
  });

  const onSignInWithGithub = useMemoizedFn(async () => {
    setLoading('github');
    try {
      const res = await signInWithGithub();
      if (res?.error) throw res.error;
    } catch (error: any) {
      errorFallback(error);
    }
    setLoading('github');
  });

  const onSignInWithAzure = useMemoizedFn(async () => {
    setLoading('azure');
    try {
      const res = await signInWithAzure();
      if (res?.error) throw res.error;
    } catch (error: any) {
      errorFallback(error);
    }
    setLoading('azure');
  });

  const onSignUp = useMemoizedFn(async (d: { email: string; password: string }) => {
    setLoading('email');
    try {
      const res = await signUp(d);
      if (res?.error) throw res.error;

      setSignUpSuccess(true);
    } catch (error: any) {
      errorFallback(error);
    }
    setLoading(null);
  });

  const onSubmitClick = useMemoizedFn((d: { email: string; password: string }) => {
    try {
      setErrorMessages([]);
      setLoading('email');

      if (signUpFlow) onSignUp(d);
      else onSignInWithUsernameAndPassword(d);
    } catch (error: any) {
      const errorMessage = rustErrorHandler(error);
      if (errorMessage?.message == 'User already registered') {
        onSignInWithUsernameAndPassword(d);
        return;
      }
      if (errorMessage?.message) {
        setErrorMessages([errorMessage.message]);
      } else {
        setErrorMessages(['An error occurred']);
      }
      setLoading(null);
    }
  });

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-[330px]">
        {signUpSuccess ? (
          <SignUpSuccess setSignUpSuccess={setSignUpSuccess} setSignUpFlow={setSignUpFlow} />
        ) : (
          <LoginOptions
            onSubmitClick={onSubmitClick}
            setSignUpFlow={setSignUpFlow}
            errorMessages={errorMessages}
            loading={loading}
            setErrorMessages={setErrorMessages}
            signUpFlow={signUpFlow}
            onSignInWithGoogle={onSignInWithGoogle}
            onSignInWithGithub={onSignInWithGithub}
            onSignInWithAzure={onSignInWithAzure}
          />
        )}
      </div>
    </div>
  );
};

const LoginOptions: React.FC<{
  onSubmitClick: (d: { email: string; password: string }) => void;
  onSignInWithGoogle: () => void;
  onSignInWithGithub: () => void;
  onSignInWithAzure: () => void;
  setSignUpFlow: (value: boolean) => void;
  errorMessages: string[];
  loading: 'google' | 'github' | 'azure' | 'email' | null;
  setErrorMessages: (value: string[]) => void;
  signUpFlow: boolean;
}> = ({
  onSubmitClick,
  onSignInWithGoogle,
  onSignInWithGithub,
  onSignInWithAzure,
  setSignUpFlow,
  errorMessages,
  loading,
  setErrorMessages,
  signUpFlow
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [passwordCheck, setPasswordCheck] = useState(false);
  const disableSubmitButton =
    !inputHasText(password) || !inputHasText(password2) || password !== password2 || !passwordCheck;

  const clearAllCookies = useMemoizedFn(() => {
    Object.keys(Cookies.get()).forEach((cookieName) => {
      Cookies.remove(cookieName);
    });
  });

  const onSubmitClickPreflight = useMemoizedFn(async (d: { email: string; password: string }) => {
    clearAllCookies();
    onSubmitClick(d);
  });

  useHotkeys('meta+shift+b', () => {
    setSignUpFlow(false);
    onSubmitClickPreflight({
      email: DEFAULT_CREDENTIALS.email,
      password: DEFAULT_CREDENTIALS.password
    });
  });

  return (
    <>
      <div className="flex flex-col items-center text-center">
        <WelcomeText signUpFlow={signUpFlow} />
      </div>

      <form
        className="my-6 space-y-3"
        onSubmit={(v) => {
          v.preventDefault();
          onSubmitClickPreflight({
            email,
            password
          });
        }}>
        <Button
          prefix={<Google />}
          onClick={() => {
            clearAllCookies();
            onSignInWithGoogle();
          }}
          block={true}
          loading={loading === 'google'}>
          {!signUpFlow ? `Continue with Google` : `Sign up with Google`}
        </Button>
        <Button
          prefix={<Github />}
          onClick={() => {
            clearAllCookies();
            onSignInWithGithub();
          }}
          block={true}
          loading={loading === 'github'}>
          {!signUpFlow ? `Continue with Github` : `Sign up with Github`}
        </Button>
        <Button
          prefix={<Microsoft />}
          onClick={() => {
            clearAllCookies();
            onSignInWithAzure();
          }}
          block={true}
          loading={loading === 'azure'}>
          {!signUpFlow ? `Continue with Azure` : `Sign up with Azure`}
        </Button>

        <div className="bg-border h-[0.5px] w-full" />

        <Input
          type="email"
          placeholder="What is your email address?"
          name="email"
          id="email"
          value={email}
          onChange={(v) => {
            setEmail(v.target.value);
          }}
          disabled={!!loading}
          autoComplete="email"
        />

        <div className="relative">
          <Input
            value={password}
            onChange={(v) => {
              setPassword(v.target.value);
            }}
            disabled={!!loading}
            id="password"
            type="password"
            name="password"
            placeholder="Password"
            autoComplete="new-password"
          />
          {signUpFlow && (
            <div className="absolute top-0 right-1.5 flex h-full items-center">
              <PolicyCheck password={password} show={signUpFlow} onCheckChange={setPasswordCheck} />
            </div>
          )}
        </div>
        {signUpFlow && (
          <Input
            value={password2}
            onChange={(v) => {
              setPassword2(v.target.value);
            }}
            disabled={!!loading}
            id="password2"
            type="password"
            name="password2"
            placeholder="Confirm password"
            autoComplete="new-password"
          />
        )}

        <div className="flex flex-col space-y-0.5">
          {errorMessages.map((message, index) => (
            <LoginAlertMessage key={index} message={message} />
          ))}
        </div>

        <PolicyCheck
          password={password}
          show={signUpFlow && disableSubmitButton && !!password}
          placement="top">
          <Button
            block={true}
            type="submit"
            loading={loading === 'email'}
            variant="black"
            disabled={!signUpFlow ? false : disableSubmitButton}>
            {!signUpFlow ? `Sign in` : `Sign up`}
          </Button>
        </PolicyCheck>
      </form>

      <div className="flex flex-col gap-y-2 pt-0">
        <AlreadyHaveAccount
          setErrorMessages={setErrorMessages}
          setPassword2={setPassword2}
          setSignUpFlow={setSignUpFlow}
          signUpFlow={signUpFlow}
        />

        {!signUpFlow && <ResetPasswordLink email={email} />}
      </div>
    </>
  );
};

const SignUpSuccess: React.FC<{
  setSignUpSuccess: (value: boolean) => void;
  setSignUpFlow: (value: boolean) => void;
}> = ({ setSignUpSuccess, setSignUpFlow }) => {
  return (
    <SuccessCard
      title="Thanks for signing up"
      message="Please check your email to verify your account."
      extra={[
        <Button
          key="login"
          variant="black"
          onClick={() => {
            setSignUpSuccess(false);
            setSignUpFlow(true);
          }}>
          Go to Login
        </Button>
      ]}
    />
  );
};

const WelcomeText: React.FC<{
  signUpFlow: boolean;
}> = ({ signUpFlow }) => {
  const text = !signUpFlow ? `Sign in` : `Sign up for free`;

  return (
    <Title className="mb-0" as="h1">
      {text}
    </Title>
  );
};

const LoginAlertMessage: React.FC<{
  message: string;
}> = ({ message }) => {
  return (
    <Text size="xs" variant="danger">
      {message}
    </Text>
  );
};

const AlreadyHaveAccount: React.FC<{
  setErrorMessages: (value: string[]) => void;
  setPassword2: (value: string) => void;
  setSignUpFlow: (value: boolean) => void;
  signUpFlow: boolean;
}> = React.memo(({ setErrorMessages, setPassword2, setSignUpFlow, signUpFlow }) => {
  return (
    <div className="flex items-center justify-center gap-0.5">
      <Text className="" variant="secondary" size="xs">
        {signUpFlow ? `Already have an account? ` : `Don’t already have an account? `}
      </Text>

      <Text
        variant="primary"
        size="xs"
        className={cn('ml-1 cursor-pointer font-normal')}
        onClick={() => {
          setErrorMessages([]);
          setPassword2('');
          setSignUpFlow(!signUpFlow);
        }}>
        {!signUpFlow ? `Sign up` : `Sign in`}
      </Text>
    </div>
  );
});
AlreadyHaveAccount.displayName = 'AlreadyHaveAccount';

const ResetPasswordLink: React.FC<{ email: string }> = ({ email }) => {
  const scrubbedEmail = useMemo(() => {
    if (!email || !isValidEmail(email)) return '';
    try {
      return encodeURIComponent(email.trim());
    } catch (error) {
      console.error('Error encoding email:', error);
      return '';
    }
  }, [email]);

  return (
    <Link
      className={cn('flex w-full cursor-pointer justify-center text-center font-normal')}
      href={
        createBusterRoute({
          route: BusterRoutes.AUTH_RESET_PASSWORD_EMAIL
        }) + `?email=${scrubbedEmail}`
      }>
      <Text variant="primary" size="xs">
        Reset password
      </Text>
    </Link>
  );
};
