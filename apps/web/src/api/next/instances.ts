import { createAxiosInstance } from '../createAxiosInstance';
import env from '@/config/envClient';

const nextApi = createAxiosInstance(env.NEXT_PUBLIC_API_URL || '');

export default nextApi;

export { nextApi };
