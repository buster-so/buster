'use client';

import { useGetUser } from '@/api/buster_rest';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useUserConfigContextSelector } from '@/context/Users';
import React, { useLayoutEffect, useState } from 'react';
import { UserHeader } from './UserHeader';
import { SegmentToApp, UserSegments, UserSegmentsApps } from './UserSegments';

export const LayoutHeaderAndSegment = React.memo(
  ({ children, userId }: { children: React.ReactNode; userId: string }) => {
    const { data: user } = useGetUser({ userId });
    const isAdmin = useUserConfigContextSelector((x) => x.isAdmin);
    const currentRoute = useAppLayoutContextSelector((x) => x.currentRoute);
    const [selectedApp, setSelectedApp] = useState<UserSegmentsApps>(
      SegmentToApp[currentRoute as keyof typeof SegmentToApp] || UserSegmentsApps.OVERVIEW
    );

    useLayoutEffect(() => {
      if (currentRoute && currentRoute in SegmentToApp) {
        setSelectedApp(SegmentToApp[currentRoute as keyof typeof SegmentToApp]);
      }
    }, [currentRoute]);

    if (!user) return null;

    return (
      <div className="flex flex-col space-y-5">
        <UserHeader user={user} />
        <UserSegments
          userId={userId}
          isAdmin={isAdmin}
          selectedApp={selectedApp}
          onSelectApp={setSelectedApp}
        />
        {children}
      </div>
    );
  }
);

LayoutHeaderAndSegment.displayName = 'LayoutHeaderAndSegment';
