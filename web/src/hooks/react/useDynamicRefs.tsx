import React from 'react';

const map = new Map<string, React.RefObject<unknown | null>>();

const setRef = <T,>(key: string): React.RefObject<T | null> | void => {
  if (!key) return console.warn(`useDynamicRefs: Cannot set ref without key `);
  const ref = React.createRef<T>();
  map.set(key, ref);
  return ref;
};

const getRef = <T,>(key: string): React.RefObject<T | null> | void => {
  if (!key) return console.warn(`useDynamicRefs: Cannot get ref without key`);
  return map.get(key) as React.RefObject<T | null>;
};

const useDynamicRefs = <T,>(): [
  (key: string) => React.RefObject<T | null> | void,
  (key: string) => React.RefObject<T | null> | void
] => {
  return [getRef, setRef];
};

export default useDynamicRefs;
export { useDynamicRefs };
