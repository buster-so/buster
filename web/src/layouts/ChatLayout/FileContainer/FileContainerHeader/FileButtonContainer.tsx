import type React from 'react';

export const FileButtonContainer: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <div className="flex items-center gap-1">{children}</div>;
};
