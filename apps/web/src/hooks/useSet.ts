'use client';

import { useState } from 'react';
import { useMemoizedFn } from './useMemoizedFn';

function useSet<K>(initialValue?: Iterable<K>) {
  const getInitValue = () => new Set(initialValue);
  const [set, setSet] = useState<Set<K>>(getInitValue);

  const add = (key: K) => {
    if (set.has(key)) {
      return;
    }
    setSet((prevSet) => {
      const temp = new Set(prevSet);
      temp.add(key);
      return temp;
    });
  };

  const remove = (key: K) => {
    if (!set.has(key)) {
      return;
    }
    setSet((prevSet) => {
      const temp = new Set(prevSet);
      temp.delete(key);
      return temp;
    });
  };

  const reset = () => setSet(getInitValue());

  const has = (key: K) => set.has(key);

  const size = () => set.size;

  const replace = (newSet: K[]) => setSet(new Set(newSet));

  return [
    set,
    {
      add: useMemoizedFn(add),
      replace: useMemoizedFn(replace),
      remove: useMemoizedFn(remove),
      reset: useMemoizedFn(reset),
      has: useMemoizedFn(has),
      size: useMemoizedFn(size)
    }
  ] as const;
}

export { useSet };
