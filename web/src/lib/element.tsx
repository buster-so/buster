import isElement from 'lodash/isElement';
import type React from 'react';

export const getAbsoluteHeight = (el: HTMLElement) => {
  // Get the DOM Node if you pass in a string
  const _el: HTMLElement | null = typeof el === 'string' ? document.querySelector(el) : el;
  if (window && _el && el && isElement(_el)) {
    const styles = window.getComputedStyle(_el);
    const margin = Number.parseFloat(styles.marginTop) + Number.parseFloat(styles.marginBottom);
    return Math.ceil(_el.offsetHeight + margin);
  }
  return el?.offsetHeight || 0;
};

export const getAbsoluteWidth = (el: HTMLElement) => {
  // Get the DOM Node if you pass in a string
  const _el: HTMLElement | null = typeof el === 'string' ? document.querySelector(el) : el;
  if (window && _el && el && isElement(_el)) {
    const styles = window.getComputedStyle(_el);
    const margin = Number.parseFloat(styles.marginLeft) + Number.parseFloat(styles.marginRight);
    return Math.ceil(_el.offsetWidth + margin);
  }
  return el?.offsetWidth || 0;
};

export const getTextWidth = (
  text: string,
  options?: Partial<{ fontFamily: string; fontSize: number }>
) => {
  const { fontSize = 14, fontFamily = '-apple-system' } = options || {};
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    canvas.remove();
    return 0;
  }

  // Set the font style for the text
  context.font = `${fontSize}px ${fontFamily}`;

  // Measure the width of the string
  const width = context.measureText(text).width;

  // Clean up the temporary canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
  canvas.remove();

  return width;
};

export const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const boldHighlights = (name: string, highlights: string[]): React.ReactNode => {
  try {
    if (highlights.length === 0) {
      return name;
    }

    const nameParts = name.split(' ').filter(Boolean);
    const lowerCaseHighlights = highlights.map((highlight) => highlight.toLowerCase());
    const boldRegex = new RegExp(`(${lowerCaseHighlights.join('|')})`, 'gi');
    const formattedParts = nameParts.map((part, index) => {
      const matches = part.toLowerCase().match(boldRegex);
      if (matches) {
        const splitParts = part.split(boldRegex);
        return splitParts.map((splitPart, splitIndex) => {
          if (matches.includes(splitPart.toLowerCase())) {
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: Combined key with content is stable
              <span className="font-semibold" key={`bold-${splitPart}-${splitIndex}`}>
                {splitPart}
              </span>
            );
          }
          // biome-ignore lint/suspicious/noArrayIndexKey: Combined key with content is stable
          return <span key={`normal-${splitPart}-${splitIndex}`}>{splitPart}</span>;
        });
      }
      return <span key={`part-${part}`}>{part}</span>;
    });

    return formattedParts.map((part, index) => {
      return (
        <span
          style={{
            marginRight: 2.5
          }}
          key={`formatted-${typeof part === 'string' ? part : index}`}>
          {part}
        </span>
      );
    });
  } catch (error) {
    console.error(error);
    return String(name);
  }
};
