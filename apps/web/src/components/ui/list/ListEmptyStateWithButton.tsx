import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { Paragraph, Title } from '@/components/ui/typography';

export const ListEmptyStateWithButton: React.FC<{
  isAdmin?: boolean;
  title: string;
  description: string;
  onClick?: () => void;
  buttonText: string;
  buttonPrefix?: React.ReactNode;
  buttonSuffix?: React.ReactNode;
  loading?: boolean;
  linkButton?: string;
  linkButtonTarget?: '_blank' | '_self';
}> = React.memo(
  ({
    isAdmin = true,
    buttonPrefix,
    buttonSuffix,
    linkButton,
    title,
    buttonText,
    description,
    onClick,
    loading = false,
    linkButtonTarget
  }) => {
    return (
      <div className="flex h-full w-full flex-col">
        <div
          className="flex h-full w-full flex-col items-center justify-start space-y-5 text-center"
          style={{
            marginTop: '25vh'
          }}>
          <div className="flex w-full max-w-[450px] min-w-[350px] flex-col justify-center space-y-3">
            <Title as="h4" className="leading-1.3 text-center [text-wrap:balance]">
              {title}
            </Title>

            <Paragraph variant="secondary">{description}</Paragraph>
          </div>

          {isAdmin && (
            <ButtonWrapper href={linkButton} target={linkButtonTarget}>
              <Button
                variant="default"
                prefix={buttonPrefix || <Plus />}
                suffix={buttonSuffix}
                loading={loading}
                onClick={onClick}>
                {buttonText}
              </Button>
            </ButtonWrapper>
          )}
        </div>
      </div>
    );
  }
);

const ButtonWrapper: React.FC<{
  children: React.ReactNode;
  href?: string;
  target?: '_blank' | '_self';
}> = ({ children, href, target }) => {
  if (!href) return <>{children}</>;
  return (
    <Link href={href} target={target || '_self'}>
      {children}
    </Link>
  );
};

ListEmptyStateWithButton.displayName = 'ListEmptyStateWithButton';
