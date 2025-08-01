import { z } from 'zod';
import { AssetTypeSchema } from '../assets/asset-types.types';
import { OrganizationStatusSchema } from '../organization';
import { OrganizationRoleSchema } from '../organization/roles.types';
import { createOptionalQueryArrayPreprocessor } from '../type-utilities';

export const UserRequestSchema = z.object({
  user_id: z.string(),
});

export type UserRequest = z.infer<typeof UserRequestSchema>;

export const UserUpdateRequestSchema = z.object({
  user_id: z.string(),
  name: z.string().optional(),
  role: OrganizationRoleSchema.optional(),
});

export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;

export const UserInviteRequestSchema = z.object({
  emails: z.array(z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)),
  team_ids: z.array(z.string()).optional(),
});

export type UserInviteRequest = z.infer<typeof UserInviteRequestSchema>;

export const UserCreateFavoriteRequestSchema = z.object({
  id: z.string(),
  asset_type: AssetTypeSchema,
  index: z.number().optional(),
  name: z.string(),
});

export type UserCreateFavoriteRequest = z.infer<typeof UserCreateFavoriteRequestSchema>;

export const UserDeleteFavoriteRequestSchema = z.array(z.string());

export type UserDeleteFavoriteRequest = z.infer<typeof UserDeleteFavoriteRequestSchema>;

export const UserUpdateFavoriteRequestSchema = z.array(z.string());

export type UserUpdateFavoriteRequest = z.infer<typeof UserUpdateFavoriteRequestSchema>;

export const GetUserListRequestSchema = z.object({
  team_id: z.string(),
  page: z.number().optional(),
  page_size: z.number().optional(),
});

export type GetUserListRequest = z.infer<typeof GetUserListRequestSchema>;

export const GetUserToOrganizationRequestSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  page_size: z.coerce.number().min(1).max(5000).default(25),
  user_name: z.string().optional(),
  email: z.string().optional(),
  //We need this because the frontend sends the roles as a comma-separated string in the query params
  role: createOptionalQueryArrayPreprocessor(OrganizationRoleSchema).optional(),
  //We need this because the frontend sends the status as a comma-separated string in the query params
  status: createOptionalQueryArrayPreprocessor(OrganizationStatusSchema)
    .default(['active'])
    .optional(),
});

export type GetUserToOrganizationRequest = Partial<
  z.infer<typeof GetUserToOrganizationRequestSchema>
>;
