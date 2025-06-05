import { createInstance } from '../createInstance';

const nextApi = createInstance(process.env.NEXT_PUBLIC_URL || '');

export default nextApi;

export { nextApi };
