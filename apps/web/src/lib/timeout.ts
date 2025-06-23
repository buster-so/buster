import debounce from 'lodash/debounce';
import memoize from 'lodash/memoize';
import wrap from 'lodash/wrap';

export const timeout = (time = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

export const createDebounceByParams = (
  func: (...args: unknown[]) => unknown,
  resolver: (obj: unknown) => string | number,
  d: { delay: number }
) => {
  /*const hocSaveDebounced = createDebounceByParams(
  save,
  (d: any) => {
    return d.id; //set resolver to cache by id
  },
  { delay: 500 }
);
*/
  return wrap(
    memoize(() => debounce(func, d.delay)),
    (getMemoizedFunc: unknown, obj: unknown) =>
      (getMemoizedFunc as (obj: unknown) => (...args: unknown[]) => unknown)(obj)(obj)
  );
};
