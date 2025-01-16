'use client';

import { Button } from 'antd';
import { Component, ErrorInfo, ReactNode } from 'react';
import { Title } from '@/components/text';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GlobalErrorComponent extends Component<Props, State> {
  state = {
    hasError: false
  };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex min-h-screen w-screen flex-col items-center justify-center bg-opacity-90 bg-gradient-to-br from-gray-50 to-gray-200 p-8 backdrop-blur-sm backdrop-brightness-95 backdrop-filter"
          role="alert">
          <div className="-mt-4 max-w-md rounded-lg border border-gray-200 bg-white/90 p-10">
            <div className="mb-8 flex flex-col gap-4">
              <Title className="animate-fade-in text-center" level={1}>
                Looks like we hit an error! 😅
              </Title>

              <Title level={5} className="animate-slide-up !m-0 !text-gray-600">
                Don&apos;t worry, it&apos;s not you - it&apos;s us!
              </Title>
              <Title level={5} className="animate-slide-up !m-0 !text-gray-500">
                If this error persists, please contact Buster support!
              </Title>
            </div>

            <a href="/" className="block">
              <Button type="primary" block size="large" className="w-full">
                Take Me Home 🏠
              </Button>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
