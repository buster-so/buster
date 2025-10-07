import { Command } from 'cmdk';
import { cn } from '@/lib/utils';
import { IndeterminateLinearLoader } from '../../loaders';

export const SearchLoading = ({
  loading = false,
  showTopLoading = false,
}: {
  loading?: boolean;
  showTopLoading?: boolean;
}) => {
  return (
    <Command.Loading className="w-full border-b swag relative">
      {showTopLoading && loading && (
        <IndeterminateLinearLoader
          className={cn('w-full absolute top-0 left-0 right-0')}
          height={0.5}
        />
      )}
    </Command.Loading>
  );
};
