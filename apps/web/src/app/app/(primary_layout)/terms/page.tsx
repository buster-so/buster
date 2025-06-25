'use client';

import { useState } from 'react';
import { AppPageLayout } from '@/components/ui/layouts';
import { TermsListController } from '@/controllers/TermsListController';
import { TermsHeader } from '@/controllers/TermsListController/TermsHeader';

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
