'use client';

import React, { useMemo, useState } from 'react';
import { User } from '@supabase/auth-js';
import { Button } from '@/components/ui/buttons';
import { Input } from '@/components/ui/inputs';
import { inputHasText, isValidEmail } from '@/lib';
import { useKeyPress, useMemoizedFn } from 'ahooks';
import Link from 'next/link';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { BsGithub, BsGoogle, BsMicrosoft } from 'react-icons/bs';
import { Title, Text } from '@/components/ui/typography';
import Cookies from 'js-cookie';
import { PolicyCheck } from './PolicyCheck';
import { rustErrorHandler } from '@/api/buster_rest/errors';
import { cn } from '@/lib/classMerge';
import {
  signInWithAzure,
  signInWithEmailAndPassword,
  signInWithGithub,
  signInWithGoogle,
  signUp
} from '@/server_context/supabaseAuthMethods';
import { SuccessCard } from '@/components/ui/card/SuccessCard';

const DEFAULT_CREDENTIALS = {
  email: process.env.NEXT_PUBLIC_USER!,
  password: process.env.NEXT_PUBLIC_USER_PASSWORD!
};

export const LoginForm: React.FC<{
  user: null | User;
}> = ({ user }) => {
  const hasSupabaseUser = !!user;

  const [loading, setLoading] = useState<'google' | 'github' | 'azure' | 'email' | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [signUpFlow, setSignUpFlow] = useState(hasSupabaseUser);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const hasUser = signUpFlow;

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

  const onSubmitClick = (d: { email: string; password: string }) => {
    try {
      setErrorMessages([]);
      setLoading('email');

      if (hasUser) onSignInWithUsernameAndPassword(d);
      else onSignUp(d);
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
  };

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-[330px]">
        {signUpSuccess ? (
          <SignUpSuccess setSignUpSuccess={setSignUpSuccess} setSignUpFlow={setSignUpFlow} />
        ) : (
          <LoginOptions
            hasUser={hasUser}
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
  hasUser: boolean;
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
  hasUser,
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

  useKeyPress(['meta.shift.b', 'shift.ctrl.b'], async () => {
    setSignUpFlow(false);
    onSubmitClickPreflight({
      email: DEFAULT_CREDENTIALS.email,
      password: DEFAULT_CREDENTIALS.password
    });
  });

  return (
    <>
      <div className="flex flex-col items-center text-center">
        <WelcomeText hasUser={hasUser} />
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
          prefix={<BsGoogle size={12} />}
          onClick={() => {
            clearAllCookies();
            onSignInWithGoogle();
          }}
          block={true}
          loading={loading === 'google'}>
          {hasUser ? `Continue with Google` : `Sign up with Google`}
        </Button>
        <Button
          prefix={<BsGithub size={12} />}
          onClick={() => {
            clearAllCookies();
            onSignInWithGithub();
          }}
          block={true}
          loading={loading === 'github'}>
          {hasUser ? `Continue with Github` : `Sign up with Github`}
        </Button>
        <Button
          prefix={<BsMicrosoft size={12} />}
          onClick={() => {
            clearAllCookies();
            onSignInWithAzure();
          }}
          block={true}
          loading={loading === 'azure'}>
          {hasUser ? `Continue with Azure` : `Sign up with Azure`}
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
          <div className="absolute top-0 right-1.5 flex h-full items-center">
            <PolicyCheck password={password} show={!hasUser} onCheckChange={setPasswordCheck} />
          </div>
        </div>
        {!hasUser && (
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
          show={!hasUser && disableSubmitButton && !!password}
          placement="top">
          <Button
            block={true}
            type="submit"
            loading={loading === 'email'}
            variant="black"
            disabled={hasUser ? false : disableSubmitButton}>
            {hasUser ? `Sign in` : `Sign up`}
          </Button>
        </PolicyCheck>
      </form>

      <div className="flex flex-col gap-y-2 pt-0">
        <AlreadyHaveAccount
          hasUser={hasUser}
          setErrorMessages={setErrorMessages}
          setPassword2={setPassword2}
          setSignUpFlow={setSignUpFlow}
          signUpFlow={signUpFlow}
        />

        {hasUser && <ResetPasswordLink email={email} />}
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
  hasUser: boolean;
}> = ({ hasUser }) => {
  const text = hasUser ? `Sign in` : `Sign up for free`;

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
  hasUser: boolean;
  setErrorMessages: (value: string[]) => void;
  setPassword2: (value: string) => void;
  setSignUpFlow: (value: boolean) => void;
  signUpFlow: boolean;
}> = React.memo(({ hasUser, setErrorMessages, setPassword2, setSignUpFlow, signUpFlow }) => {
  return (
    <div className="flex items-center justify-center gap-0.5">
      <Text className="" variant="secondary" size="xs">
        {!hasUser ? `Already have an account? ` : `Don’t already have an account? `}
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
        {hasUser ? `Sign up` : `Sign in`}
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
