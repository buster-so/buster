import { BackButton } from '@/components/ui/buttons';
import type React from 'react';

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
