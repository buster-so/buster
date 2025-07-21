import { z } from 'zod';
export declare function generateSecureState(): string;
export declare function isExpired(expiresAt: number): boolean;
export declare function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown, errorMessage: string): T;
//# sourceMappingURL=validation-helpers.d.ts.map