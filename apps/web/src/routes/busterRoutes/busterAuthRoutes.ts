export enum BusterAuthRoutes {
  AUTH_LOGIN = '/auth/login',
  AUTH_CALLBACK = '/auth/callback',
  AUTH_CONFIRM = '/auth/confirm',
  AUTH_RESET_PASSWORD = '/auth/reset-password',
  AUTH_RESET_PASSWORD_EMAIL = '/auth/reset-password-email',
  AUTH_CONFIRM_EMAIL = '/auth/confirm-email',
  AUTH_AUTH_CODE_ERROR = '/auth/auth-code-error'
}

export type BusterAuthRoutesWithArgs = {
  [BusterAuthRoutes.AUTH_LOGIN]: { route: BusterAuthRoutes.AUTH_LOGIN };
  [BusterAuthRoutes.AUTH_CALLBACK]: { route: BusterAuthRoutes.AUTH_CALLBACK };
  [BusterAuthRoutes.AUTH_RESET_PASSWORD]: { route: BusterAuthRoutes.AUTH_RESET_PASSWORD };
  [BusterAuthRoutes.AUTH_CONFIRM_EMAIL]: { route: BusterAuthRoutes.AUTH_CONFIRM_EMAIL };
  [BusterAuthRoutes.AUTH_RESET_PASSWORD]: { route: BusterAuthRoutes.AUTH_RESET_PASSWORD };
  [BusterAuthRoutes.AUTH_CONFIRM]: { route: BusterAuthRoutes.AUTH_CONFIRM };
  [BusterAuthRoutes.AUTH_AUTH_CODE_ERROR]: { route: BusterAuthRoutes.AUTH_AUTH_CODE_ERROR };
  [BusterAuthRoutes.AUTH_RESET_PASSWORD_EMAIL]: {
    route: BusterAuthRoutes.AUTH_RESET_PASSWORD_EMAIL;
  };
};
