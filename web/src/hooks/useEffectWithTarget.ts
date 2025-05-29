import {
  type DependencyList,
  type EffectCallback,
  useEffect,
  type useLayoutEffect,
  useRef
} from 'react';
import { depsAreSame } from '@/lib/depAreSame';
import type { BasicTarget } from '@/lib/domTarget';
import { getTargetElement } from '@/lib/domTarget';
import { useUnmount } from './useUnmount';

const createEffectWithTarget = (useEffectType: typeof useEffect | typeof useLayoutEffect) => {
  /**
   *
   * @param effect
   * @param deps
   * @param target target should compare ref.current vs ref.current, dom vs dom, ()=>dom vs ()=>dom
   */
  const useEffectWithTarget = (
    effect: EffectCallback,
    deps: DependencyList,
    target: BasicTarget<Element> | BasicTarget<Element>[]
  ) => {
    const hasInitRef = useRef(false);

    const lastElementRef = useRef<(Element | null | undefined)[]>([]);
    const lastDepsRef = useRef<DependencyList>([]);

    const unLoadRef = useRef<ReturnType<EffectCallback>>();

    useEffectType(() => {
      const targets = Array.isArray(target) ? target : [target];
      const els = targets.map((item) => getTargetElement(item));

      // init run
      if (!hasInitRef.current) {
        hasInitRef.current = true;
        lastElementRef.current = els;
        lastDepsRef.current = deps;

        unLoadRef.current = effect();
        return;
      }

      if (
        els.length !== lastElementRef.current.length ||
        !depsAreSame(lastElementRef.current, els) ||
        !depsAreSame(lastDepsRef.current, deps)
      ) {
        if (typeof unLoadRef.current === 'function') {
          unLoadRef.current();
        }

        lastElementRef.current = els;
        lastDepsRef.current = deps;
        unLoadRef.current = effect();
      }
    });

    useUnmount(() => {
      if (typeof unLoadRef.current === 'function') {
        unLoadRef.current();
      }
      // for react-refresh
      hasInitRef.current = false;
    });
  };

  return useEffectWithTarget;
};

export const useEffectWithTarget = createEffectWithTarget(useEffect);
