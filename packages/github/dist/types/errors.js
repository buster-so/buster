export class GitHubIntegrationError extends Error {
    code;
    retryable;
    context;
    constructor(code, message, retryable = false, context) {
        super(message);
        this.code = code;
        this.retryable = retryable;
        this.context = context;
        this.name = 'GitHubIntegrationError';
    }
}
