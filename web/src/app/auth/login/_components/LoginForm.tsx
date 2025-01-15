'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Divider, Input, Result } from 'antd';
import { User } from '@supabase/auth-js';
import { inputHasText } from '@/utils';
import { useKeyPress, useMemoizedFn } from 'ahooks';
import Link from 'next/link';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { BsGithub, BsGoogle, BsMicrosoft } from 'react-icons/bs';
import { createStyles } from 'antd-style';
import { Text } from '@/components/text/Text';
import { Title } from '@/components/text/Title';
import Cookies from 'js-cookie';
import { useBusterSupabaseAuthMethods } from '@/hooks/useBusterSupabaseAuthMethods';
import { PolicyCheck } from './PolicyCheck';
import { rustErrorHandler } from '@/api/buster-rest/errors';

const DEFAULT_CREDENTIALS = {
  email: process.env.NEXT_PUBLIC_USER!,
  password: process.env.NEXT_PUBLIC_USER_PASSWORD!
};

export const useStyles = createStyles(({ token, css }) => ({
  link: {
    color: token.colorPrimary
  }
}));

export const LoginForm: React.FC<{
  user: null | User;
  signInWithEmailAndPassword: ReturnType<
    typeof useBusterSupabaseAuthMethods
  >['signInWithEmailAndPassword'];
  signInWithGoogle: ReturnType<typeof useBusterSupabaseAuthMethods>['signInWithGoogle'];
  signUp: ReturnType<typeof useBusterSupabaseAuthMethods>['signUp'];
  signInWithGithub: ReturnType<typeof useBusterSupabaseAuthMethods>['signInWithGithub'];
  signInWithAzure: ReturnType<typeof useBusterSupabaseAuthMethods>['signInWithAzure'];
}> = ({
  user,
  signInWithEmailAndPassword,
  signInWithGoogle,
  signInWithGithub,
  signInWithAzure,
  signUp
}) => {
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
  const { styles, cx } = useStyles();

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

  const onSubmitClickPreflight = async (d: { email: string; password: string }) => {
    clearAllCookies();
    onSubmitClick(d);
  };

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
          type={'default'}
          icon={<BsGoogle size={12} />}
          onClick={() => {
            clearAllCookies();
            onSignInWithGoogle();
          }}
          block={true}
          loading={loading === 'google'}>
          {hasUser ? `Continue with Google` : `Sign up with Google`}
        </Button>
        <Button
          type={'default'}
          icon={<BsGithub size={12} />}
          onClick={() => {
            clearAllCookies();
            onSignInWithGithub();
          }}
          block={true}
          loading={loading === 'github'}>
          {hasUser ? `Continue with Github` : `Sign up with Github`}
        </Button>
        <Button
          type={'default'}
          icon={<BsMicrosoft size={12} />}
          onClick={() => {
            clearAllCookies();
            onSignInWithAzure();
          }}
          block={true}
          loading={loading === 'azure'}>
          {hasUser ? `Continue with Azure` : `Sign up with Azure`}
        </Button>

        <Divider plain>or</Divider>

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
          <div className="absolute top-0 flex h-full items-center" style={{ right: 10 }}>
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
            htmlType="submit"
            loading={loading === 'email'}
            type="primary"
            disabled={hasUser ? false : disableSubmitButton}>
            {hasUser ? `Sign in` : `Sign up`}
          </Button>
        </PolicyCheck>
      </form>

      <div className="pt-0">
        <Text className="mb-1.5 flex w-full justify-center text-center" type="secondary" size="xxs">
          {!hasUser ? `Already have an account? ` : `Don’t already have an account? `}
          <Text
            type="primary"
            size="xxs"
            className={cx('ml-1 cursor-pointer font-normal', styles.link)}
            onClick={() => {
              setErrorMessages([]);
              setPassword2('');
              setSignUpFlow(!signUpFlow);
            }}>
            {hasUser ? `Sign up` : `Sign in`}
          </Text>
        </Text>

        {hasUser && (
          <Link
            className={cx(
              'flex w-full cursor-pointer justify-center text-center font-normal',
              styles.link
            )}
            href={
              createBusterRoute({
                route: BusterRoutes.AUTH_RESET_PASSWORD_EMAIL
              }) + `?email=${email}`
            }>
            <Text type="primary" size="xxs">
              Reset password
            </Text>
          </Link>
        )}
      </div>
    </>
  );
};

const SignUpSuccess: React.FC<{
  setSignUpSuccess: (value: boolean) => void;
  setSignUpFlow: (value: boolean) => void;
}> = ({ setSignUpSuccess, setSignUpFlow }) => {
  return (
    <Result
      status="success"
      title="Thanks for signing up"
      subTitle="Please check your email to verify your account."
      extra={[
        <Button
          key="login"
          type="primary"
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
    <Title className="mb-0" level={1}>
      {text}
    </Title>
  );
};

const LoginAlertMessage: React.FC<{
  message: string;
}> = ({ message }) => {
  return (
    <Text size="xxs" type="danger" className="">
      {message}
    </Text>
  );
};
