'use client';

import { BusterRoutes, createBusterRoute } from '@/routes';
import { permanentRedirect } from 'next/navigation';

export default function SettingsPage() {
  return permanentRedirect(
    createBusterRoute({
      route: BusterRoutes.SETTINGS_PROFILE
    })
  );
}
