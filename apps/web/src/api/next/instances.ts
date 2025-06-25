import { createAxiosInstance } from '../createAxiosInstance';

const nextApi = createAxiosInstance(process.env.NEXT_PUBLIC_API_URL || '');

export default nextApi;

export { nextApi };
