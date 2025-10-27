import { z } from 'zod';

export const DbtProjectFileModelPathsSchema = z.object({
  'model-paths': z.array(z.string()),
});

export type DbtProjectFileModelPaths = z.infer<typeof DbtProjectFileModelPathsSchema>;
