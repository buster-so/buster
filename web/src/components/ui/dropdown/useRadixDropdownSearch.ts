import { useMemoizedFn } from '@/hooks';

export const useRadixDropdownSearch = ({
  showIndex,
  onSelectItem,
  onChange: onChangeProp
}: {
  showIndex?: boolean;
  onSelectItem?: (index: number) => void;
  onChange: (text: string) => void;
}) => {
  const onKeyDown = useMemoizedFn((e: React.KeyboardEvent<HTMLInputElement>) => {
    const isFirstCharacter = (e.target as HTMLInputElement).value.length === 0;

    // Only prevent default for digit shortcuts when showIndex is true
    if (showIndex && isFirstCharacter && /^Digit[0-9]$/.test(e.code)) {
      e.preventDefault();
      const index = Number.parseInt(e.key);
      onSelectItem?.(index);
    } else if (e.key === 'ArrowDown') {
      // Find the first dropdown item and focus it
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      if (menuItems.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        (menuItems[0] as HTMLElement).focus();
      }
    } else {
      e.stopPropagation();
    }
  });

  const onChange = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onChangeProp(e.target.value);
  });

  return {
    onKeyDown,
    onChange
  };
};
