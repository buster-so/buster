import type React from 'react';
import { PermissionTitleCard } from './PermissionTitleCard';
import { PermissionsAppContainer } from './PermissionsAppContainer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="m-auto flex h-full max-w-[1400px] flex-col space-y-5 overflow-y-auto px-14 pt-12">
      <PermissionTitleCard />
      <PermissionsAppContainer>{children}</PermissionsAppContainer>
    </div>
  );
}
