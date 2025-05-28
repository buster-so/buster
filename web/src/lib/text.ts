import isNumber from 'lodash/isNumber';
import truncate from 'lodash/truncate';
import { formatNumber } from './numbers';

export const inputHasText = (input: unknown): boolean => {
  if (typeof input !== 'string') {
    return false;
  }
  const trimmedInput = input.trim();
  return trimmedInput.length > 0;
};

const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
  }
  return '';
};

export const removeAllSpaces = (str?: string) => {
  return str ? str.replace(/\s/g, '') : '';
};

export const getInitials = (value: string | null | undefined): string => {
  if (!value) return '';

  // Split by spaces or other common separators and filter out empty strings
  const words = value.trim().split(/\s+/).filter(Boolean);

  // If we have multiple words, use the first letter of the first two words
  if (words.length >= 2) {
    return words
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  }

  // If we have only one word, split by capital letters
  const capitalizedLetters = value.match(/[A-Z]/g);

  if (capitalizedLetters && capitalizedLetters.length >= 2) {
    return capitalizedLetters.slice(0, 2).filter(Boolean).join('');
  }
  return '';
};

export const makeHumanReadble = (input: string | number | undefined | null): string => {
  if (!input && !isNumber(input)) {
    return '';
  }

  if (isNumber(input)) {
    return String(input);
  }

  if (input === null || input === undefined) {
    return '';
  }

  let convertedString: string;
  const inputString = String(input);

  // Check if input is in snake case
  if (inputString.includes('_')) {
    convertedString = inputString
      .split('_')
      .map((word) => capitalizeFirstLetter(word))
      .join(' ');
  }
  // Check if input is in camel case
  else if (/[a-z][A-Z]/.test(inputString)) {
    convertedString = inputString.replace(/([a-z])([A-Z])/g, '$1 $2');
    convertedString = capitalizeFirstLetter(convertedString);
  }
  // If input is already in a readable format
  else {
    convertedString = capitalizeFirstLetter(inputString);
  }

  return convertedString;
};

export const calculateTextWidth = (text: string, font: string): number => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 0;
  context.font = font;
  const width = context.measureText(text).width;
  canvas.remove();
  return width;
};

export const truncateText = (text: string, characters: number) => {
  if (text.length <= characters) return text;
  return truncate(text, { length: characters });
};
