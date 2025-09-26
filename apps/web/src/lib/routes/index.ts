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
