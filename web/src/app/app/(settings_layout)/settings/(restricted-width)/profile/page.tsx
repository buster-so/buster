'use client';

import { Avatar } from '@/components/ui/avatar';
import { Text, Title } from '@/components/ui/typography';
import { useUserConfigContextSelector } from '@/context/Users';
import { formatDate } from '@/lib/date';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';

export default function ProfilePage() {
  const user = useUserConfigContextSelector((state) => state.user);

  if (!user) return null;

  const { name, email, created_at } = user;

  return (
    <div>
      <SettingsPageHeader title="Profile" description="Manage your profile & information" />

      <div className="bg-background rounded-lg border shadow">
        {/* Header Section */}
        <div className="border-border/30 flex flex-col items-center gap-4 border-b p-6 sm:flex-row sm:items-start">
          <Avatar name={name} className="h-12 w-12" fallbackClassName="text-2xl" />
          <div className="flex flex-col justify-center gap-1">
            <Title as="h3" className="text-foreground">
              {name}
            </Title>
            <Text className="text-gray-light mt-1">{email}</Text>
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <Text variant="secondary">Member Since</Text>
            <Text className="font-medium">{formatDate({ date: created_at, format: 'll' })}</Text>
          </div>

          <div className="flex items-center justify-between">
            <Text variant="secondary">Account Status</Text>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <Text>Active</Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
