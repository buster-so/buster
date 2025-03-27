'use client';

import { AppPageLayout } from '@/components/ui/layouts';
import { TermsListController } from '@/controllers/TermsListController';
import { TermsHeader } from '@/controllers/TermsListController/TermsHeader';
import { useState } from 'react';

export const dynamic = 'force-static';

export default function TermsPage() {
  const [openNewTermsModal, setOpenNewTermsModal] = useState(false);

  return (
    <AppPageLayout
      headerSizeVariant="list"
      header={
        <TermsHeader
          openNewTermsModal={openNewTermsModal}
          setOpenNewTermsModal={setOpenNewTermsModal}
        />
      }>
      <TermsListController setOpenNewTermsModal={setOpenNewTermsModal} />
    </AppPageLayout>
  );
}
