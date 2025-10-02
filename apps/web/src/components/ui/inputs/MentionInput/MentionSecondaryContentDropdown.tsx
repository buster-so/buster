import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../../buttons';
import { Dropdown, type IDropdownItems } from '../../dropdown';
import { Dots } from '../../icons';

interface MentionSecondaryContentDropdownProps {
  items: IDropdownItems;
}

export const MentionSecondaryContentDropdown = ({
  items,
}: MentionSecondaryContentDropdownProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Dropdown open={open} onOpenChange={setOpen} items={items}>
      <Button
        variant={'ghost'}
        className={cn(
          'hover:bg-item-active hidden group-hover/mention-list-item:flex group-data-[selected=true]/mention-list-item:flex -mr-1.5',
          open && 'flex!'
        )}
        prefix={<Dots />}
      />
    </Dropdown>
  );
};
