if (!process.env.ELECTRIC_PROXY_URL) {
  throw new Error('ELECTRIC_PROXY_URL is not set');
}

if (process.env.NODE_ENV !== 'development' && !process.env.ELECTRIC_SOURCE_ID) {
  console.warn('ELECTRIC_SOURCE_ID is not set');
}

export const getElectricShapeUrl = (requestUrl: string) => {
  const url = new URL(requestUrl);

  const baseUrl = process.env.ELECTRIC_PROXY_URL || '';

  // Parse the base URL and replace the path with /v1/shape
  const baseUrlObj = new URL(baseUrl);
  baseUrlObj.pathname = '/v1/shape';
  const originUrl = new URL(baseUrlObj.toString());

  if (process.env.ELECTRIC_SOURCE_ID) {
    originUrl.searchParams.set('source_id', process.env.ELECTRIC_SOURCE_ID);
  }

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
