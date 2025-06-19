import type { Metadata } from 'next';
import type React from 'react';
import type { PropsWithChildren } from 'react';
import NewUserWelcome from '@/assets/png/new-user-welcome.png';

export const metadata: Metadata = {
  title: 'Buster Login'
};

const LoginLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <section className="h-[100vh]">
      <div className="flex h-[100vh] items-center">
        <div className="mx-auto flex min-h-[100vh] w-full">
          <div className="hidden w-1/2 max-w-[650px] md:flex">{children}</div>
          <div className="relative flex w-full flex-col items-center justify-center">
            <div
              className="w-full"
              style={{
                height: '84vh',
                background: `url(${NewUserWelcome.src}) no-repeat left center`,
                backgroundSize: 'cover'
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginLayout;
