import type { Octokit } from 'octokit';

/**
 * Type for the parameters of the checks.update method
 * Extracted from Octokit's rest endpoint types
 */
export type ChecksUpdateParams = Parameters<Octokit['rest']['checks']['update']>[0];

/**
 * Type for the parameters of the checks.create method
 * Extracted from Octokit's rest endpoint types
 */
export type ChecksCreateParams = Parameters<Octokit['rest']['checks']['create']>[0];

/**
 * Type for the parameters of the checks.get method
 * Extracted from Octokit's rest endpoint types
 */
export type ChecksGetParams = Parameters<Octokit['rest']['checks']['get']>[0];
