import { BusterLogo } from '@/assets/svg/BusterLogo';
import { Button } from '@/components/ui/buttons';
import { Card, CardContent, CardFooter } from '@/components/ui/card/CardBase';
import { ArrowUpRight } from '@/components/ui/icons';
import { Paragraph, Text, Title } from '@/components/ui/typography';
import { BUSTER_GETTING_STARTED_URL } from '@/routes/externalRoutes';

export default function GettingStartedPage() {
  return (
    <div className="container flex min-h-screen w-full min-w-screen items-center justify-center py-10">
      <Card className="w-full max-w-lg">
        <CardContent className="space-y-4 pt-6 text-center">
          <>
            <div className="flex justify-center">
              <BusterLogo className="h-10 w-10" />
            </div>

            <Title as={'h1'} variant="default">
              Welcome to Buster!
            </Title>
            <Paragraph size={'md'}>
              It looks like your organization hasn&apos;t been fully set up yet. To get started with
              Buster, you&apos;ll need to complete the organization setup process or verify your
              payment information.
            </Paragraph>
          </>
        </CardContent>
        <CardFooter className="w-full pt-0">
          <a
            href={BUSTER_GETTING_STARTED_URL}
            target="_blank"
            className="w-full"
            rel="noopener noreferrer">
            <Button
              size="tall"
              variant={'black'}
              block
              suffix={
                <span className="text-base">
                  <ArrowUpRight />
                </span>
              }>
              Get Started
            </Button>
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}
