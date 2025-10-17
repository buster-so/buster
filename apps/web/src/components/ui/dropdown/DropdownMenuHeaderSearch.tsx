import { useEffect, useRef } from 'react';
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
  className = '',
}: DropdownMenuHeaderSearchProps<T>) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { onChange: onChangePreflight, onKeyDown: onKeyDownPreflight } = useRadixDropdownSearch({
    showIndex,
    onSelectItem,
    onChange,
  });

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready after animations
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Try immediate focus first
    focusInput();

    // If that doesn't work, try after the next frame
    requestAnimationFrame(() => {
      focusInput();
    });

    // Add keyboard listener to refocus input when typing
    const handleKeyDown = (e: Event) => {
      const keyboardEvent = e as KeyboardEvent;

      // Skip if already focused on input
      if (document.activeElement === inputRef.current) {
        return;
      }

      // Check if this is a printable character (letter, number, space, etc.)
      // Ignore special keys like arrows, Enter, Escape, Tab, etc.
      const isPrintableChar =
        keyboardEvent.key.length === 1 &&
        !keyboardEvent.ctrlKey &&
        !keyboardEvent.metaKey &&
        !keyboardEvent.altKey;

      if (isPrintableChar && inputRef.current) {
        // Refocus the input and append the typed character
        inputRef.current.focus();
        // The character will be captured by the input since we're not preventing default
      }
    };

    // Find the menu element to attach the listener
    const menuElement = inputRef.current?.closest('[role="menu"]');
    if (menuElement) {
      menuElement.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (menuElement) {
        menuElement.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  return (
    <div className={cn('flex items-center gap-x-0', className)}>
      <span className="text-icon-color ml-2 flex">
        <Magnifier />
      </span>
      <Input
        ref={inputRef}
        autoFocus={true}
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
