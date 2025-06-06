import type React from 'react';
import { BackButton } from '@/components/ui/buttons';

export const HeaderContainer: React.FC<{
  buttonText: string;
  linkUrl: string;
  onClick?: () => void;
}> = ({ onClick, linkUrl, buttonText }) => {
  return (
    <div className="mb-3">
      <BackButton linkUrl={linkUrl} onClick={onClick} text={buttonText} />
    </div>
  );
};
