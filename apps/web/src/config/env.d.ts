import { ClientEnv } from './envClient';

export interface ServerEnv {
  NEXT_SLACK_APP_SUPPORT_URL?: string;
}

export interface Env extends ClientEnv, ServerEnv {}

// Main env (client + server)
declare const env: Env;
export default env;
