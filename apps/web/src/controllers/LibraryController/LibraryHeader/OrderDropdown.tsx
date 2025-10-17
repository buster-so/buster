import React from 'react';
import { Button } from '@/components/ui/buttons/Button';
import type { LibraryLayout, LibrarySearchParams } from '../schema';

export const OrderDropdown = React.memo(({ layout }: { layout: LibraryLayout }) => {
  return <Button variant="ghost" prefix={<Sliders3 />} onClick={() => {}} />;
});

OrderDropdown.displayName = 'OrderDropdown';
