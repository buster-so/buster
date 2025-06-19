import { cn } from '@/lib/classMerge';
import { Magnifier } from '../icons';
import { Input } from '../inputs';
import { useRadixDropdownSearch } from './useRadixDropdownSearch';

interface DropdownMenuHeaderSearchProps<T> {
  text: string;
  onChange: (text: string) => void;
  onSelectItem?: (index: number) => void;
  onPressEnter?: () => void;
  placeholder?: string;
  showIndex?: boolean;
  className?: string;
}

export const DropdownMenuHeaderSearch = <T,>({
  text,
  onChange,
  onSelectItem,
  onPressEnter,
  showIndex = false,
  placeholder,
  className = ''
}: DropdownMenuHeaderSearchProps<T>) => {
  const { onChange: onChangePreflight, onKeyDown: onKeyDownPreflight } = useRadixDropdownSearch({
    showIndex,
    onSelectItem,
    onChange
  });

  return (
    <div className={cn('flex items-center gap-x-0', className)}>
      <span className="text-icon-color ml-2 flex">
        <Magnifier />
      </span>
      <Input
        autoFocus
        variant={'ghost'}
        className="pl-1.5!"
        size={'small'}
        placeholder={placeholder}
        value={text}
        onChange={onChangePreflight}
        onKeyDown={onKeyDownPreflight}
        onPressEnter={onPressEnter}
      />
    </div>
  );
};

DropdownMenuHeaderSearch.displayName = 'DropdownMenuHeaderSearch';
