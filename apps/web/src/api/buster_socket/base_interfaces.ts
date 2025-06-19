/**
 * Base interface for Buster Socket requests
 * @template R - The route type, defaults to string
 * @template T - The payload type, defaults to Object
 */
export interface BusterSocketRequestBase<R = string, T = object> {
  route: R;
  payload: T;
}

/**
 * Interface representing the raw response message from the server
 * @template R - The route type, defaults to string
 * @template E - The event type, defaults to string
 * @template P - The payload type, defaults to unknown
 */
export interface BusterSocketResponseMessage<R = string, E = string, P = unknown> {
  route: R;
  payload: P;
  error: null | BusterSocketError;
  event: E;
}

/**
 * Interface combining route and event for listener consumption
 * @template R - The route type, defaults to string
 * @template P - The payload type, defaults to unknown
 */
export interface BusterSocketResponseBase<R = string, P = unknown> {
  route: R;
  payload: P;
  error: null | BusterSocketError;
}

/**
 * Interface representing an error response from the Buster Socket
 */
export interface BusterSocketError {
  /** Error code identifier */
  code: string;
  /** Human-readable error message */
  message: string;
}

/**
 * Base interface for event-related operations
 */
export interface EventBase {
  /** Indicates the current progress state of the event */
  progress: 'in_progress' | 'completed';
}
