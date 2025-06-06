import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';
import pickBy from 'lodash/pickBy';

type ObjectKeys<T> = keyof T;
type CommonKeys<T, U> = ObjectKeys<T> & ObjectKeys<U>;

/**
 * Compares two objects based on specified keys
 * @param obj1 First object to compare
 * @param obj2 Second object to compare
 * @param keys Array of keys to compare
 * @returns boolean indicating if the objects are equal for the specified keys
 * @throws Error if either object is null/undefined or keys array is empty
 */
export const compareObjectsByKeys = <K extends string>(
  obj1: Record<K, unknown>,
  obj2: Record<K, unknown>,
  keys: K[]
): boolean => {
  // Input validation
  if (!obj1 || !obj2) {
    throw new Error('Both objects must be defined');
  }

  if (!Array.isArray(keys) || keys.length === 0) {
    throw new Error('Keys array must be non-empty');
  }

  // Compare values for each key
  return keys.every((key) => {
    const val1 = obj1[key];
    const val2 = obj2[key];

    // Handle special cases
    if (val1 === val2) return true;
    if (val1 === null || val2 === null) return val1 === val2;

    // Handle arrays explicitly
    if (Array.isArray(val1) && Array.isArray(val2)) {
      const arrayEqual = isEqual(val1, val2);

      return arrayEqual;
    }

    // Handle other objects
    if (typeof val1 === 'object' && typeof val2 === 'object') {
      const itWasEqual = isEqual(val1, val2) || isEqual(JSON.stringify(val1), JSON.stringify(val2));

      // if (!itWasEqual) {
      //   console.log('--------------NESTED KEYS NOT EQUAL------------------');
      //   console.log('KEY', key);
      //   console.log('ORIGINAL', val1);
      //   console.log('NEW', val2);
      // }

      return itWasEqual;
    }

    const itWasEqual = isEqual(val1, val2);

    // if (!itWasEqual) {
    //   console.log('--------------KEYS NOT EQUAL------------------');
    //   console.log('KEY', key);
    //   console.log('ORIGINAL', val1);
    //   console.log('NEW', val2);
    // }

    return itWasEqual;
  });
};

export const isJsonParsed = (jsonString: string): boolean => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
};

export const isStringifiedJson = (value: string): boolean => {
  try {
    const parsedValue = JSON.parse(value);
    return typeof parsedValue === 'object' && parsedValue !== null;
  } catch (error) {
    return false;
  }
};

export const extractStringToJSON = (value: string): object | false => {
  try {
    const parsedValue = JSON.parse(value);
    if (typeof parsedValue === 'object') {
      return parsedValue;
    }
    if (typeof value === 'string' && !!value) {
      return extractStringToJSON(parsedValue);
    }
  } catch (error) {
    return false;
  }
  return false;
};

export const getChangedValues = <T extends object>(
  object1: T,
  object2: T,
  keysToCheck: (keyof T)[]
): Partial<T> => {
  return pickBy(object2, (value, key) => {
    if (!keysToCheck.includes(key as keyof T)) {
      return false; // Ignore keys not in the specified list
    }
    return !isEqual(value, (object1 as Record<string, unknown>)[key]); // Compare values and return true if they are not equal
  }) as Partial<T>;
};

export const compareByKeys = <T, U>(obj1: T, obj2: U, keys: (keyof T)[]): boolean => {
  return isEqual(pick(obj1, keys), pick(obj2, keys));
};

export const removeUndefined = (obj: Record<string, unknown> = {}) => {
  for (const key of Object.keys(obj)) {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  }
  return obj;
};

export const setNestedProperty = <T>(obj: T, path: (keyof T)[], value: unknown): T => {
  return path.reduceRight(
    (acc, key, index) => ({
      ...((index === 0 ? obj : acc) as Record<string, unknown>),
      [key]: acc
    }),
    value
  ) as T;
};
