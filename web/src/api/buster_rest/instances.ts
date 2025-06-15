import { createAxiosInstance } from '../createAxiosInstance';
import { createHonoInstance } from '../createHonoInstance';
import { BASE_URL } from './config';

const mainApi = createAxiosInstance(BASE_URL);
const mainApiV2 = createHonoInstance(BASE_URL);

export default mainApi;
export { mainApi, mainApiV2 };
