'use client';
import { Button } from '@/components/ui/buttons';
import { Card, CardContent, CardFooter } from '@/components/ui/card/CardBase';
import Link from 'next/link';
import { useEffect } from 'react';

// Error boundaries must be Client Components

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorCard />;
}

const ErrorCard = () => {
  return (
    <div
      className="bg-opacity-90 flex min-h-screen w-screen flex-col items-center justify-center bg-linear-to-br from-gray-50 to-gray-200 p-8 backdrop-blur-xs backdrop-brightness-95 backdrop-filter"
      role="alert">
      <Card className="-mt-10">
        <CardContent>
          <div className="flex flex-col gap-4">
            <h1 className="animate-fade-in text-2xl font-medium">Looks like we hit an error! 😅</h1>

            <h5 className="animate-slide-up m-0 text-base font-medium text-gray-600">
              Don&apos;t worry, it&apos;s not you - it&apos;s us!
            </h5>
            <h5 className="animate-slide-up m-0 text-base font-medium text-gray-500">
              If this error persists, please contact Buster support!
            </h5>
          </div>
        </CardContent>

        <CardFooter className="w-full pt-0">
          <Link href="/" className="w-full">
            <Button variant="black" block size="tall">
              Take Me Home 🏠
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
