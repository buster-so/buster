import { createContext, useContext } from 'react';

/**
 * Context for managing global content expansion state
 * Provides consistent expansion behavior across all message components
 * The expansion state is managed at the root level to avoid multiple useInput listeners
 */
interface ExpansionContextValue {
  isExpanded: boolean;
}

export const ExpansionContext = createContext<ExpansionContextValue>({
  isExpanded: false,
});

/**
 * Hook for accessing expansion state from context
 * Use this in message components to check if content should be expanded
 */
export function useExpansion(): boolean {
  const { isExpanded } = useContext(ExpansionContext);
  return isExpanded;
}
