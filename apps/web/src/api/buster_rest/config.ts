import env from '@/config/envClient';

export const BASE_API_URL = `${env.NEXT_PUBLIC_API_URL}`;
export const BASE_API_URL_V2 = `${env.NEXT_PUBLIC_API2_URL}`;
export const BASE_URL = `${BASE_API_URL}/api/v1`;
export const BASE_URL_V2 = `${BASE_API_URL_V2}/api/v2`;
