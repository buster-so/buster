import isNumber from 'lodash/isNumber';
import { formatNumber } from './numbers';

export const inputHasText = (input: unknown): boolean => {
  if (typeof input !== 'string') {
    return false;
  }
  const trimmedInput = input.trim();
  return trimmedInput.length > 0;
};

export const getFirstTwoCapitalizedLetters = (input: string) => {
  const capitalizedLetters = input
    .replace('@', '')
    .replace(/[^A-Za-z]/g, '') // Remove non-alphabetic characters
    .match(/[A-Z]/g); // Find all uppercase letters

  if (capitalizedLetters && capitalizedLetters.length < 2) {
    return input
      .replace('@', '')
      .replace(/[^A-Za-z]/g, '')
      .slice(0, 2)
      .toUpperCase();
  }
  if (capitalizedLetters && capitalizedLetters.length >= 2) {
    return capitalizedLetters.slice(0, 2).filter(Boolean).join('');
  } else {
    return '';
  }
};

export const removeAllSpaces = (str?: string) => {
  return str ? str.replace(/\s/g, '') : '';
};

export const makeHumanReadble = (input: string | number | undefined | null): string => {
  if (!input && !isNumber(input)) {
    return '';
  }

  if (isNumber(input)) {
    return formatNumber(input, {
      compact: false,
      minDecimals: 0,
      maximumDecimals: 2,
      useGrouping: true
    });
  }

  let convertedString: string;
  input = String(input);

  // Check if input is in snake case
  if (input.includes('_')) {
    convertedString = input.replace(/_/g, ' ').toLowerCase();
  }
  // Check if input is in camel case
  else if (input.charAt(0) === input.charAt(0).toLowerCase()) {
    convertedString = input.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  }
  // Check if input is in pascal case
  else {
    convertedString = input.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  }

  // Capitalize the first letter of each word
  const words = convertedString.split(' ');
  const capitalizedWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  return capitalizedWords.join(' ');
};
