import React from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { Dots, Plus, Sliders3 } from '@/components/ui/icons';
import BarsFilter from '@/components/ui/icons/NucleoIconOutlined/bars-filter';
import { Text } from '@/components/ui/typography/Text';
import { useLibraryLayout } from '@/context/Library/useLibraryLayout';
import type { LibraryLayout, LibrarySearchParams } from '../schema';
import { FilterSwitch } from './FilterSwitch';

export const LibraryHeader: React.FC<{
  layout: LibraryLayout;
  filters: LibrarySearchParams;
}> = React.memo(({ layout, filters }) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-3">
        <Text>Library</Text>
        <FilterSwitch filter={filters.filter} />
      </div>
      <div className="flex items-center space-x-1">
        <Button variant="ghost" prefix={<Plus />} onClick={() => {}} />
        <Button variant="ghost" prefix={<BarsFilter />} onClick={() => {}} />
        <Button variant="ghost" prefix={<Sliders3 />} onClick={() => {}} />
        <Button variant="ghost" prefix={<Dots />} onClick={() => {}} />
      </div>
    </div>
  );
});
