import { Hono } from 'hono';
import { standardErrorHandler } from '../../../../utils/response';
import GET from './GET';
import PUT from './PUT';

const app = new Hono().route('/', GET).route('/', PUT).onError(standardErrorHandler);

export default app;
