import type {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';

//RESPONSE TYPES

export type BusterSocketResponseConfig<TRoute extends BusterSocketResponseRoute> = {
  route: TRoute;
  onError?: (d: unknown) => void;
};

export type BusterSocketResponseConfigRoute =
  BusterSocketResponseConfig<BusterSocketResponseRoute>['route'];

export type InferBusterSocketResponseData<TRoute extends BusterSocketResponseRoute> = Extract<
  BusterSocketResponse,
  { route: TRoute }
>['callback'] extends (d: infer D) => void
  ? D
  : never;

//REQUEST TYPES

export type BusterSocketRequestRoute = BusterSocketRequest['route'];

export type BusterSocketRequestConfig<TRoute extends BusterSocketRequestRoute> = {
  route: TRoute;
};

export type InferBusterSocketRequestPayload<TRoute extends BusterSocketRequestRoute> = Extract<
  BusterSocketRequest,
  { route: TRoute }
>['payload'];
