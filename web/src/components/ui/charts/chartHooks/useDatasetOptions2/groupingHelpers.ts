const KEY_VALUE_DELIMITER = '__🔑__';
const PAIR_DELIMITER = '__📍__';

const createKeyValueChain = (
  pairs: Array<{ key: string | null; value: string | null }>
): string => {
  return pairs.map(({ key, value }) => [key, value].join(KEY_VALUE_DELIMITER)).join(PAIR_DELIMITER);
};

export const extractFieldsFromChain = (
  text: string | number,
  filterValueless: boolean = false
): Array<{ key: string; value: string }> => {
  if (!text) return [];

  const split = String(text).split(PAIR_DELIMITER);
  const mapped = split.map((pair) => {
    const [key, value] = pair.split(KEY_VALUE_DELIMITER);
    return {
      key: key ?? '',
      value: value ?? ''
    };
  });
  const filtered = mapped.filter(({ value }) => !filterValueless || value !== '');

  return filtered;
};

export const appendToKeyValueChain = (
  newPair:
    | { key: string | null; value: string | null }
    | Array<{ key: string | null; value: string | null }>,
  existingChain?: string | undefined
): string => {
  const existingPairs = existingChain ? extractFieldsFromChain(existingChain) : [];
  const newPairsArray = Array.isArray(newPair) ? newPair : [newPair];
  return createKeyValueChain([...existingPairs, ...newPairsArray]);
};
