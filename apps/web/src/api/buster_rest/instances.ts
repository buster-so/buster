import { createAxiosInstance } from '../createAxiosInstance';
import { BASE_URL, BASE_URL_V2 } from './config';

const mainApi = createAxiosInstance(BASE_URL);
const mainApiV2 = createAxiosInstance(BASE_URL_V2);

export default mainApi;
export { mainApi, mainApiV2 };
