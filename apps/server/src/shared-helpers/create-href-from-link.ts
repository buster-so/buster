import { z } from 'zod';

const CreateHrefFromLinkParamsSchema = z.object({
  to: z.string().describe('Route path with param placeholders like /path/$paramName'),
  params: z.record(z.string()).describe('Object mapping param names to values'),
  search: z.record(z.union([z.string(), z.number(), z.boolean(), z.undefined()])).optional().describe('Query parameters'),
});

type CreateHrefFromLinkParams = z.infer<typeof CreateHrefFromLinkParamsSchema>;

/**
 * Creates a full href from a route definition by:
 * 1. Replacing $paramName placeholders with actual values
 * 2. Appending query parameters
 * 3. Prepending the public URL domain
 */
export function createHrefFromLink(input: CreateHrefFromLinkParams): string {
  const { to, params, search } = CreateHrefFromLinkParamsSchema.parse(input);

  // Replace $paramName with actual param values
  let path = to;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`$${key}`, value);
  }

  // Build query string from search params
  const queryParams = new URLSearchParams();
  if (search) {
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    }
  }

  const queryString = queryParams.toString();
  const fullPath = queryString ? `${path}?${queryString}` : path;

  // Get base URL from environment
  const baseUrl = process.env.VITE_PUBLIC_URL || '';

  return `${baseUrl}${fullPath}`;
}
