export interface BusterTerm {
  created_by: {
    id: string;
    name: string;
  };
  created_at: string;
  datasets: {
    id: string;
    name: string;
  }[];
  definition: string;
  deleted_at: string | null;
  id: string;
  name: string;
  organization_id: string;
  permission: string;
  sql_snippet: string;
  updated_at: string | null;
  updated_by: string | null;
}

export interface BusterTermListItem {
  id: string;
  name: string;
  created_by: {
    id: string;
    name: string;
  };
  dataset_count: number;
  last_edited: string;
}
