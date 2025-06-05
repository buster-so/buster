import type { SelectItem } from '@/components/ui/select';

export const PERMISSION_USERS_OPTIONS: SelectItem<'included' | 'not_included'>[] = [
  {
    label: 'Assigned',
    value: 'included'
  },
  {
    label: 'Not assigned',
    value: 'not_included'
  }
];
