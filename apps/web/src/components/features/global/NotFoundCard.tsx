import { Link, type NotFoundRouteComponent } from '@tanstack/react-router';
import { Button } from '@/components/ui/buttons';
import { Card, CardContent, CardFooter } from '@/components/ui/card/CardBase';

// Displays a full-screen, visually polished 404 not found state
// inspired by GlobalErrorCard with consistent styling and components.
export const NotFoundCard = () => {
  return (
    <section
      className="flex flex-col items-center z-[999] absolute inset-0 top-0 left-0 right-0 bottom-0 justify-center h-full w-full p-8 bg-background"
      aria-label="Page not found"
    >
      <Card className="-mt-10 max-w-100">
        <CardContent>
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-medium">404 - Page not found</h1>

            <h5 className="m-0 text-base font-medium text-gray-600">
              The page you are looking for doesn’t exist or may have been moved.
            </h5>
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
    </section>
  );
};
