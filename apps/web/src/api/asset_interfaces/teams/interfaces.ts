/**
 * Represents a team in the system
 */
export interface BusterTeam {
  /** Unique identifier for the team */
  id: string;
  /** Name of the team */
  name: string;
  /** Optional description of the team */
  description?: string;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}
