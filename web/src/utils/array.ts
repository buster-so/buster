export const getPredictableItemBasedOnText = <T>(array: T[], input: string): T => {
  const stringToHash = (input: string): number => {
    let hash = 0;
    if (input.length === 0) {
      return hash;
    }
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };

  const hash = stringToHash(input);
  const index = hash % array.length;
  return array[index] as T;
};

export const getPredictableTailwindColor = (
  input: string,
  classColors: string[] = [
    'bg-red-300',
    'bg-orange-300',
    'bg-amber-300',
    'bg-yellow-300',
    'bg-lime-300',
    'bg-green-300',
    'bg-blue-300',
    'bg-gray-300'
  ]
): string => {
  return getPredictableItemBasedOnText(classColors, input);
};
