import { createAxiosInstance } from '../createAxiosInstance';
import { BASE_URL } from './config';

const mainApi = createAxiosInstance(BASE_URL);
export default mainApi;
export { mainApi };
