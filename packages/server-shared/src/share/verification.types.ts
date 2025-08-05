import type { verificationEnum } from '@buster/database';
import { z } from 'zod';

type VerificationStatusBase = (typeof verificationEnum.enumValues)[number] | 'notVerified';
const VerificationStatusEnums: Record<VerificationStatusBase, VerificationStatusBase> =
  Object.freeze({
    notRequested: 'notRequested',
    requested: 'requested',
    inReview: 'inReview',
    verified: 'verified',
    backlogged: 'backlogged',
    notVerified: 'notVerified',
  });

export const VerificationStatusSchema = z.enum(
  Object.values(VerificationStatusEnums) as [VerificationStatusBase, ...VerificationStatusBase[]]
);

export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;
