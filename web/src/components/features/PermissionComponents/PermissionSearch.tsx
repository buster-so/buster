import type React from 'react';
import { Input } from '@/components/ui/inputs';
import { useMemoizedFn } from '@/hooks';

export const PermissionSearch: React.FC<{
  className?: string;
  searchText: string;
  setSearchText: (text: string) => void;
  placeholder?: string;
}> = ({ className = '', searchText, setSearchText, placeholder = 'Search by name or email' }) => {
  const onChange = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  });

  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      <Input
        className="w-[280px] max-w-[280px]"
        placeholder={placeholder}
        value={searchText}
        onChange={onChange}
      />
    </div>
  );
};
PermissionSearch.displayName = 'PermissionOverviewSearch';
