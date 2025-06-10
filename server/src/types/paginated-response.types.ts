export interface PaginationMeta {
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items across all pages */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  data: T[];
  /** Pagination metadata */
  pagination: PaginationMeta;
  /** Optional additional metadata */
  meta?: Record<string, any>;
}

export interface PaginationParams {
  /** Page number (1-based, defaults to 1) */
  page?: number;
  /** Number of items per page (defaults to 20, max 100) */
  limit?: number;
  /** Optional sorting field */
  sortBy?: string;
  /** Sort order (asc or desc, defaults to asc) */
  sortOrder?: 'asc' | 'desc';
}

// Helper type for creating paginated responses
export type CreatePaginatedResponse<T> = (
  data: T[],
  page: number,
  limit: number,
  total: number,
  meta?: Record<string, any>
) => PaginatedResponse<T>;

// Utility function to create paginated responses
export const createPaginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  meta?: Record<string, any>
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    ...(meta && { meta }),
  };
};
