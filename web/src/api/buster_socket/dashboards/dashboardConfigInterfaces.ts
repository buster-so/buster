import { BusterResizeableGridRow } from '@/components/grid';

export interface DashboardConfig {
  rows?: (Omit<BusterResizeableGridRow, 'items'> & {
    items: { id: string }[];
  })[];
}
