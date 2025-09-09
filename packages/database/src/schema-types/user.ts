// User Suggested Prompts Types
export type UserSuggestedPrompts = {
  suggestedPrompts: {
    report: string[];
    dashboard: string[];
    visualization: string[];
    help: string[];
  };
  updatedAt: string; // ISO timestamp string to match the codebase pattern
};
