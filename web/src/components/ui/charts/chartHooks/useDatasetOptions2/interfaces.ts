export interface DatasetOption {
  id: string;
  dimensions: string[];
  source: (string | number | Date | null)[][];
}
