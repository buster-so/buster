import fontColorContrast from 'font-color-contrast';

const TEXT_THRESHOLD = 0.7;

export const determineFontColorContrast = (color: string, threshold = TEXT_THRESHOLD) => {
  return fontColorContrast(color, threshold);
};

export const isBrightColor = (color: string) => {
  return determineFontColorContrast(color) === '#ffffff';
};

export const addOpacityToColor = (color: string, opacity: number): string => {
  if (opacity === 1) {
    return color;
  }

  if (color.startsWith('#')) {
    // Handle 3-character hex codes
    if (color.length === 4) {
      const r = Number.parseInt(color[1] + color[1], 16);
      const g = Number.parseInt(color[2] + color[2], 16);
      const b = Number.parseInt(color[3] + color[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Hex color (#RRGGBB)
    const r = Number.parseInt(color.slice(1, 3), 16);
    const g = Number.parseInt(color.slice(3, 5), 16);
    const b = Number.parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  if (color.startsWith('rgb')) {
    // RGB color (rgb(r, g, b))
    const rgbValues = color.match(/\d+/g);
    if (rgbValues) {
      const r = Number.parseInt(rgbValues[0]);
      const g = Number.parseInt(rgbValues[1]);
      const b = Number.parseInt(rgbValues[2]);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  } else {
    // Human-readable color (like 'red', 'blue')
    const tempElement = document.createElement('div');
    tempElement.style.color = color;
    document.body.appendChild(tempElement);

    const rgb = window.getComputedStyle(tempElement).color;
    document.body.removeChild(tempElement);

    const rgbValues = rgb.match(/\d+/g);
    if (rgbValues) {
      const r = Number.parseInt(rgbValues[0]);
      const g = Number.parseInt(rgbValues[1]);
      const b = Number.parseInt(rgbValues[2]);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }

  console.warn('color', color);
  return color;
};
