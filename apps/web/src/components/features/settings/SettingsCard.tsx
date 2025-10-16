import React from 'react';
import { Paragraph, Text, Title } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';

interface SettingsCardsProps {
  title?: string;
  description?: string;
  cards: {
    sections: React.ReactNode[];
  }[];
}

export const SettingsCards: React.FC<SettingsCardsProps> = React.memo(
  ({ title, description, cards }) => {
    return (
      <div className="flex flex-col space-y-3.5">
        {(title || description) && (
          <div className="flex flex-col space-y-1.5">
            <Title as="h3" className="text-lg">
              {title}
            </Title>
            <Paragraph variant="secondary">{description}</Paragraph>
          </div>
        )}

        {cards.map((card, index) => (
          <SettingsCard key={index} sections={card.sections} />
        ))}
      </div>
    );
  }
);
SettingsCards.displayName = 'SettingsCards';

const SettingsCard = ({ sections }: { sections: React.ReactNode[] }) => {
  return (
    <div className="flex flex-col rounded border">
      {sections.map((section, index) => (
        <div key={index} className={cn(index !== sections.length - 1 && 'border-b', 'px-4 py-3.5')}>
          {section}
        </div>
      ))}
    </div>
  );
};

export const SettingCardContent = ({
  title,
  description,
  children,
  icon,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between gap-x-2">
      <div className="flex space-x-2">
        <div className="bg-item-select flex items-center justify-center rounded p-2">{icon}</div>
        <div className="flex flex-col space-y-0.5">
          <Text>{title}</Text>
          <Text variant="secondary" size={'xs'}>
            {description}
          </Text>
        </div>
      </div>

      {children}
    </div>
  );
};
