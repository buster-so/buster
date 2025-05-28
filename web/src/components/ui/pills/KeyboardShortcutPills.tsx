import type React from 'react';
import isEmpty from 'lodash/isEmpty';
import { cn } from '@/lib/classMerge';

export const KeyboardShortcutPill: React.FC<{
  shortcut?: string[];
}> = ({ shortcut }) => {
  if (isEmpty(shortcut)) {
    return null;
  }

  return (
    <div className="flex space-x-0.5">
      {shortcut?.map((s, i) => <TooltipShortcut key={i} shortcut={s} />)}
    </div>
  );
};

KeyboardShortcutPill.displayName = 'KeyboardShortcutPill';

const TooltipShortcut: React.FC<{ shortcut: string }> = ({ shortcut }) => {
  const numberOfChars = shortcut.length;

  return (
    <div
      className={cn(
        'bg-background text-gray-light pointer-events-none relative flex h-5 items-center justify-center rounded px-[0.5px] text-xs leading-none',
        numberOfChars === 1 ? '' : 'px-1'
      )}>
      {shortcut}
    </div>
  );
};
