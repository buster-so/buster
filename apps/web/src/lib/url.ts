export const getURLPathname = (url: string): string => {
  const parsedUrl = new URL(url);
  return parsedUrl.pathname.toString();
};
