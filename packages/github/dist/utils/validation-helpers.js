import { GitHubIntegrationError } from '../types/errors';
export function generateSecureState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
export function isExpired(expiresAt) {
    return Date.now() > expiresAt;
}
export function validateWithSchema(schema, data, errorMessage) {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new GitHubIntegrationError('OAUTH_TOKEN_EXCHANGE_FAILED', `${errorMessage}: ${result.error.message}`, false, { validationErrors: result.error.errors });
    }
    return result.data;
}
