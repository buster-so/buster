export interface DashboardConfig {
  rows?: {
    columnSizes?: number[]; //columns sizes 1 - 12. MUST add up to 12
    rowHeight?: number; //pixel based!
    id: string;
    items: { id: string }[];
  }[];
}
