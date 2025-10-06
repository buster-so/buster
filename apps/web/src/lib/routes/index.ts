import type { ParsedLocation, RegisteredRouter, ValidateLinkOptions } from '@tanstack/react-router';
import type { ILinkProps } from '@/types/routes';

export function defineLink<
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(link: ILinkProps<TRouter, TOptions, TFrom>): ILinkProps<TRouter, TOptions, TFrom> {
  return link;
}

export function defineLinkFromFactory<TFrom extends string>(fromOptions: { from: TFrom }) {
  return <TRouter extends RegisteredRouter, TOptions>(
    toOptions: Omit<ValidateLinkOptions<TRouter, TOptions, TFrom>, 'from'>
  ): ValidateLinkOptions<TRouter, TOptions, TFrom> =>
    ({
      ...fromOptions,
      ...toOptions,
    }) as ValidateLinkOptions<TRouter, TOptions, TFrom>;
}

export const createFullURL = (location: ParsedLocation | string): string =>
  window.location.origin +
  (typeof location === 'string' ? (location as string) : (location as ParsedLocation).href);

export const createHrefFromLink = <
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(
  link: ILinkProps<TRouter, TOptions, TFrom>
) => {
  const buildLink = defineLink(link);

  // Start with the 'to' path
  let href = typeof buildLink.to === 'string' ? buildLink.to : '';

  // Replace path params
  if (buildLink.params && typeof buildLink.params === 'object') {
    for (const [key, value] of Object.entries(buildLink.params)) {
      href = href.replace(`:${key}`, String(value));
      href = href.replace(`$${key}`, String(value));
    }
  }

  // Append search params
  if (buildLink.search && typeof buildLink.search === 'object') {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(buildLink.search)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const searchString = searchParams.toString();
    if (searchString) {
      href += `?${searchString}`;
    }
  }

  // Append hash if present
  if (buildLink.hash) {
    href += buildLink.hash;
  }

  return href;
};
