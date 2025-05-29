import type { Metadata } from 'next';
import type React from 'react';
import type { PropsWithChildren } from 'react';
import { WelcomeToBuster } from '../../components/features/auth/WelcomeSidebar';

export const metadata: Metadata = {
  title: 'Buster Login'
};

const LoginLayout: React.FC<PropsWithChildren> = async ({ children }) => {
  return (
    <section className="h-[100vh]">
      <div className="flex h-[100vh] items-center">
        <div className="mx-auto flex min-h-[100vh] w-full">
          <div className="hidden w-1/2 bg-gray-50 md:flex dark:bg-gray-900">
            <WelcomeToBuster hasUser={true} />
          </div>
          <div className="w-full bg-white md:w-1/2 dark:bg-black">{children}</div>
        </div>
      </div>
    </section>
  );
};

export default LoginLayout;
