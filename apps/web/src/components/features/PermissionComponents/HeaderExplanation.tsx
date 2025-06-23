import React from 'react';
import { Paragraph, Title } from '@/components/ui/typography';

export const HeaderExplanation: React.FC<{
  className?: string;
  title?: string;
  description?: string;
}> = React.memo(
  ({
    className = '',
    title = 'Access & lineage',
    description = 'View which users can query this dataset. Lineage is provided to show where each user’s access originates from.'
  }) => {
    return (
      <div className={`flex flex-col space-y-1.5 ${className}`}>
        <Title as="h4">{title}</Title>
        <Paragraph variant="secondary">{description}</Paragraph>
      </div>
    );
  }
);
HeaderExplanation.displayName = 'HeaderExplanation';
