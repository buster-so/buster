import { createInstance } from '../createInstance';

export const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`;

const mainApi = createInstance(BASE_URL);
export default mainApi;
export { mainApi };
