'use client';

import Cookies from 'js-cookie';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { rustErrorHandler } from '@/api/buster_rest/errors';
import { Button } from '@/components/ui/buttons';
import { SuccessCard } from '@/components/ui/card/SuccessCard';
import Github from '@/components/ui/icons/customIcons/Github';
import Google from '@/components/ui/icons/customIcons/Google';
import Microsoft from '@/components/ui/icons/customIcons/Microsoft';
import { Input } from '@/components/ui/inputs';
import { Text, Title } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { isValidEmail } from '@/lib/email';
import {
  signInWithAzure,
  signInWithEmailAndPassword,
  signInWithGithub,
  signInWithGoogle,
  signUp
} from '@/lib/supabase/signIn';
import { inputHasText } from '@/lib/text';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { PolicyCheck } from './PolicyCheck';

const DEFAULT_CREDENTIALS = {
  email: process.env.NEXT_PUBLIC_USER || '',
  password: process.env.NEXT_PUBLIC_USER_PASSWORD || ''
};

export const LoginForm: React.FC = () => {
  const [loading, setLoading] = useState<'google' | 'github' | 'azure' | 'email' | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [signUpFlow, setSignUpFlow] = useState(true);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const errorFallback = useMemoizedFn((error: unknown) => {
    const errorMessage = rustErrorHandler(error);
    if (errorMessage?.message) {
      setErrorMessages(['Invalid email or password']);
    } else {
      setErrorMessages(['An error occurred']);
    }
  });

  const onSignInWithUsernameAndPassword = useMemoizedFn(
    async ({ email, password }: { email: string; password: string }) => {
      setLoading('email');
      try {
        await signInWithEmailAndPassword({ email, password });
      } catch (error: unknown) {
        console.error(error);
        errorFallback(error);
        setLoading(null);
      }
    }
  );

  const onSignInWithGoogle = useMemoizedFn(async () => {
    setLoading('google');
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      console.error(error);
      errorFallback(error);
      setLoading(null);
    }
  });

  const onSignInWithGithub = useMemoizedFn(async () => {
    setLoading('github');
    try {
      const res = await signInWithGithub();
    } catch (error: unknown) {
      console.error(error);
      errorFallback(error);
      setLoading(null);
    }
  });

  const onSignInWithAzure = useMemoizedFn(async () => {
    setLoading('azure');
    try {
      await signInWithAzure();
    } catch (error: unknown) {
      errorFallback(error);
      setLoading(null);
    }
  });

  const onSignUp = useMemoizedFn(async (d: { email: string; password: string }) => {
    setLoading('email');
    try {
      await signUp(d);
      setSignUpSuccess(true);
    } catch (error: unknown) {
      console.error(error);
      errorFallback(error);
      setLoading(null);
    }
  });

  const onSubmitClick = useMemoizedFn((d: { email: string; password: string }) => {
    try {
      setErrorMessages([]);
      setLoading('email');

      if (signUpFlow) onSignUp(d);
      else onSignInWithUsernameAndPassword(d);
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = rustErrorHandler(error);
      if (errorMessage?.message === 'User already registered') {
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
    for (const cookieName of Object.keys(Cookies.get())) {
      Cookies.remove(cookieName);
    }

    //also clear local storage
    localStorage.clear();
    sessionStorage.clear();
  });

  const onSubmitClickPreflight = useMemoizedFn(async (d: { email: string; password: string }) => {
    onSubmitClick(d);
  });

  useHotkeys(
    'meta+shift+b',
    (e) => {
      setSignUpFlow(false);
      onSubmitClickPreflight({
        email: DEFAULT_CREDENTIALS.email,
        password: DEFAULT_CREDENTIALS.password
      });
    },
    { preventDefault: true }
  );

  return (
    <>
      <div className="flex flex-col items-center text-center">
        <WelcomeText signUpFlow={signUpFlow} />
      </div>

      <div className="mt-6 mb-4 flex flex-col space-y-3">
        <Button
          prefix={<Google />}
          size={'tall'}
          type="button"
          onClick={() => {
            clearAllCookies();
            onSignInWithGoogle();
          }}
          block={true}
          loading={loading === 'google'}
          tabIndex={0}>
          {!signUpFlow ? 'Continue with Google' : 'Sign up with Google'}
        </Button>
        <Button
          prefix={<Github />}
          size={'tall'}
          type="button"
          onClick={() => {
            clearAllCookies();
            onSignInWithGithub();
          }}
          block={true}
          loading={loading === 'github'}
          tabIndex={-1}>
          {!signUpFlow ? 'Continue with Github' : 'Sign up with Github'}
        </Button>
        <Button
          prefix={<Microsoft />}
          size={'tall'}
          type="button"
          onClick={() => {
            clearAllCookies();
            onSignInWithAzure();
          }}
          block={true}
          loading={loading === 'azure'}
          tabIndex={-2}>
          {!signUpFlow ? 'Continue with Azure' : 'Sign up with Azure'}
        </Button>
      </div>

      <form
        className="space-y-3"
        onSubmit={(v) => {
          v.preventDefault();
          clearAllCookies();
          onSubmitClick({
            email,
            password
          });
        }}>
        <div className="bg-border mb-4 h-[0.5px] w-full" />

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
          tabIndex={-3}
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
            tabIndex={-4}
          />
        </div>
        {signUpFlow && (
          <>
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
              tabIndex={-5}
            />

            {password && (
              <PolicyCheck
                email={email}
                password={password}
                password2={password2}
                onChangePolicyCheck={setPasswordCheck}
              />
            )}
          </>
        )}

        <div className="flex flex-col space-y-0.5">
          {errorMessages.map((message, index) => (
            <LoginAlertMessage key={index + message} message={message} />
          ))}
        </div>

        <Button
          size={'tall'}
          block={true}
          type="submit"
          loading={loading === 'email'}
          variant="black"
          disabled={!signUpFlow ? false : disableSubmitButton}
          tabIndex={-6}>
          {!signUpFlow ? 'Sign in' : 'Sign up'}
        </Button>
      </form>

      <div className="mt-2 flex flex-col gap-y-2">
        <AlreadyHaveAccount
          setErrorMessages={setErrorMessages}
          setPassword2={setPassword2}
          setSignUpFlow={setSignUpFlow}
          signUpFlow={signUpFlow}
        />

        {!signUpFlow && <ResetPasswordLink email={email} tabIndex={-7} />}
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
          size={'tall'}
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
  const text = !signUpFlow ? 'Sign in' : 'Sign up for free';

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
        {signUpFlow ? 'Already have an account? ' : "Don't already have an account?"}
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
        {!signUpFlow ? 'Sign up' : 'Sign in'}
      </Text>
    </div>
  );
});
AlreadyHaveAccount.displayName = 'AlreadyHaveAccount';

const ResetPasswordLink: React.FC<{ email: string; tabIndex?: number }> = ({ email, tabIndex }) => {
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
      href={`${createBusterRoute({
        route: BusterRoutes.AUTH_RESET_PASSWORD_EMAIL
      })}?email=${scrubbedEmail}`}
      tabIndex={tabIndex}>
      <Text variant="primary" size="xs">
        Reset password
      </Text>
    </Link>
  );
};
