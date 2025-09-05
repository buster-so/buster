// Base SDK Error class
export class SDKError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'SDKError';
  }
}

// Network/connection errors
export class NetworkError extends SDKError {
  constructor(message = 'Network request failed') {
    super(message, undefined, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}
