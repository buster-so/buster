import { ELECTRIC_KEYS, getSecret } from '@buster/secrets';

export const createProxiedResponse = async (url: URL): Promise<Response> => {
  const secretKey = await getSecret(ELECTRIC_KEYS.ELECTRIC_SECRET);

  if (!secretKey) {
    throw new Error('ELECTRIC_SECRET is not set');
  }

  url.searchParams.set('secret', secretKey);

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
