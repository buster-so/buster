'use client';

import 'intersection-observer';
import { useState } from 'react';
import type { BasicTarget } from '../lib/domTarget';
import { getTargetElement } from '../lib/domTarget';
import { useEffectWithTarget } from './useEffectWithTarget';

type CallbackType = (entry: IntersectionObserverEntry) => void;

export interface Options {
  rootMargin?: string;
  threshold?: number | number[];
  root?: BasicTarget<Element>;
  callback?: CallbackType;
}

export function useInViewport(target: BasicTarget | BasicTarget[], options?: Options) {
  const { callback, ...option } = options || {};

  const [state, setState] = useState<boolean>();
  const [ratio, setRatio] = useState<number>();

  useEffectWithTarget(
    () => {
      const targets = Array.isArray(target) ? target : [target];
      const els = targets
        .map((element) => getTargetElement(element))
        .filter((el): el is Element => el != null);

      if (!els.length) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            setRatio(entry.intersectionRatio);
            setState(entry.isIntersecting);
            callback?.(entry);
          }
        },
        {
          ...option,
          root: getTargetElement(options?.root)
        }
      );

      for (const el of els) {
        observer.observe(el);
      }

      return () => {
        observer.disconnect();
      };
    },
    [options?.rootMargin, options?.threshold, callback],
    target
  );

  return [state, ratio] as const;
}
