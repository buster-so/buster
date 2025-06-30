'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/buttons';
import { Card, CardContent, CardFooter } from '@/components/ui/card/CardBase';
import { usePostHog } from 'posthog-js/react';

// Error boundaries must be Client Components

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const posthog = usePostHog();

  useEffect(() => {
    const isPosthogLoaded = posthog.__loaded;

    if (isPosthogLoaded) {
      console.log('posthog.captureException', error);
      posthog.captureException(error);
    }

    console.error(error);
  }, [error]);

  return <ErrorCard />;
}

const ErrorCard = () => {
  return (
    <div
      className="bg-opacity-90 flex min-h-screen w-screen flex-col items-center justify-center bg-linear-to-br from-gray-50 to-gray-200 p-8 backdrop-blur-xs backdrop-brightness-95 backdrop-filter"
      role="alert">
      <Card className="-mt-10 max-w-100">
        <CardContent>
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-medium">Looks like we hit an unexpected error</h1>

            <h5 className="m-0 text-base font-medium text-gray-600">
              {`Our team has been notified via Slack. We'll take a look at the issue ASAP and get back to you.`}
            </h5>
          </div>
        </CardContent>

        <CardFooter className="w-full pt-0">
          <Link href="/" className="w-full">
            <Button variant="black" block size="tall">
              Take me home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
