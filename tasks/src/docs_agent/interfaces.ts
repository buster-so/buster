/**
 * Input payload interface for the docs agent task
 */
export interface DocsAgentInput {
  /** UUID v4 identifier for the data source */
  dataSourceId: string;
}

/**
 * Output interface for the docs agent task
 */
export interface DocsAgentOutput {
  message: string;
  dataSourceId?: string;
}
