'use client';

import { permanentRedirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const dynamic = 'force-static';

export default function SettingsPage() {
  return permanentRedirect(
    createBusterRoute({
      route: BusterRoutes.SETTINGS_PROFILE
    })
  );
}
