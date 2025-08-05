import { z } from 'zod';
import { AssetPermissionRoleSchema } from './assets';

export const IndividualPermissionSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  avatar_url: z.string().nullable(),
  role: AssetPermissionRoleSchema,
});

export type IndividualPermission = z.infer<typeof IndividualPermissionSchema>;

export const IndividualPermissionsSchema = z.array(IndividualPermissionSchema);

export type IndividualPermissions = z.infer<typeof IndividualPermissionsSchema>;
