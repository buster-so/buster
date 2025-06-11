export const getElectricShapeUrl = (requestUrl: string) => {
  const url = new URL(requestUrl);

  const electricUrl = process.env.ELECTRIC_URL;

  if (!electricUrl) {
    throw new Error('ELECTRIC_URL is not set');
  }

  const baseUrl =
    electricUrl && electricUrl !== 'undefined' ? electricUrl : 'http://localhost:3000';

  // Parse the base URL and replace the path with /v1/shape
  const baseUrlObj = new URL(baseUrl);
  baseUrlObj.pathname = '/v1/shape';
  const originUrl = new URL(baseUrlObj.toString());

  // Copy over the relevant query params that the Electric client adds
  // so that we return the right part of the Shape log.
  const validParams = [
    'live',
    'table',
    'handle',
    'offset',
    'cursor',
    'where',
    'params',
    'columns',
    'replica',
    'secret',
  ];

  url.searchParams.forEach((value, key) => {
    if (validParams.includes(key)) {
      originUrl.searchParams.set(key, value);
    }
  });

  return originUrl;
};

export const createProxiedResponse = async (url: URL) => {
  const response = await fetch(url);

  // Fetch decompresses the body but doesn't remove the
  // content-encoding & content-length headers which would
  // break decoding in the browser.

  // See https://github.com/whatwg/fetch/issues/1729
  const headers = new Headers(response.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');

  // Return the proxied response
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

/**
 * Extracts a parameter value from the where clause in the URL
 * @param url - The URL object containing the where parameter
 * @param paramName - The parameter name to extract (e.g., 'chatId', 'userId')
 * @returns The parameter value or null if not found
 */
export const extractParamFromWhere = (url: URL, paramName: string): string | null => {
  const whereClause = url.searchParams.get('where');

  if (!whereClause) {
    return null;
  }

  // Create regex to match: paramName='value' or paramName="value"
  const regex = new RegExp(`${paramName}=['"]([^'"]+)['"]`);
  const match = whereClause.match(regex);

  return match?.[1] ? match[1] : null;
};
