export interface BusterSocketRequestBase<R = string, T = Object> {
  route: R;
  payload: T;
}

/**
 * This is the response from the server
 */
export interface BusterSocketResponseMessage<R = string, E = string, P = any> {
  route: R;
  payload: P;
  error: null | BusterSocketError;
  event: E;
}

/**
 * This is the response that combines the route and the event to be consumed by the listeners
 */
export interface BusterSocketResponseBase<R = string, P = any> {
  route: R;
  payload: P;
  error: null | BusterSocketError;
}

export interface BusterSocketError {
  code: string;
  message: string;
}
