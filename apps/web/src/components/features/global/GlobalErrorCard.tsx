import { type ErrorRouteComponent, Link } from '@tanstack/react-router';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/buttons';
import { Card, CardContent, CardFooter } from '@/components/ui/card/CardBase';
import { useMount } from '../../../hooks/useMount';

export const ErrorCard = ({
  header = 'Looks like we hit an unexpected error',
  message = "Our team has been notified via Slack. We'll take a look at the issue ASAP and get back to you.",
}: {
  header?: string;
  message?: string;
}) => {
  useMount(() => {
    console.error('Error in card:', header, message);
  });

  return (
    <div
      className=" flex h-full w-full flex-col items-center absolute inset-0 justify-center bg-linear-to-br bg-background p-8 backdrop-blur-xs backdrop-filter"
      role="alert"
    >
      <Card className="-mt-10 max-w-100">
        <CardContent>
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-medium">{header}</h1>

            <h5 className="m-0 text-base font-medium text-gray-600">{message}</h5>
          </div>
        </CardContent>

        <CardFooter className="w-full pt-0">
          <Link to="/" className="w-full">
            <Button variant="black" block size="tall">
              Take me home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export const GlobalErrorCard: ErrorRouteComponent = ({ error }) => {
  const posthog = usePostHog();

  useEffect(() => {
    const isPosthogLoaded = posthog.__loaded;

    if (isPosthogLoaded) {
      posthog.captureException(error);
    }
  }, [error]);

  return <ErrorCard />;
};
