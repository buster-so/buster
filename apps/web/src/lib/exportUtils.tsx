'use client';

import { timeout } from './timeout';

export async function exportJSONToCSV(
  data: Record<string, string | null | Date | number>[],
  fileName = 'data'
) {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Get all unique headers from all rows
  const headers = Array.from(new Set(data.flatMap(Object.keys)));

  // Create CSV content
  let csvContent = `${headers.join(',')}\n`;

  for (const row of data) {
    const rowValues = headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if contains comma
        const escapedValue = value.replace(/"/g, '""');
        return escapedValue.includes(',') ? `"${escapedValue}"` : escapedValue;
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return String(value);
    });
    csvContent += `${rowValues.join(',')}\n`;
  }

  // Create Blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(`${fileName}.csv`, blob);
}

function downloadFile(fileName: string, data: Blob) {
  const downloadLink = document.createElement('a');
  downloadLink.download = fileName;
  const url = URL.createObjectURL(data);
  downloadLink.href = url;
  downloadLink.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    downloadLink.remove();
  }, 100);
}

type DomToImageModule = {
  toPng: (element: HTMLElement) => Promise<string>;
};

export async function exportElementToImage(element: HTMLElement) {
  const imageData = await import('html2canvas-pro').then((m) => m.default);
  const canvas = await imageData(element, {
    backgroundColor: '#ffffff'
  });
  const dataUrl = canvas.toDataURL();
  return dataUrl;
}

export async function downloadElementToImage(element: HTMLElement, fileName: string) {
  const imageData = await exportElementToImage(element);
  downloadImageData(imageData, fileName);
}

export async function downloadImageData(imageData: string, fileName: string) {
  const link = document.createElement('a');
  link.href = imageData;
  link.download = fileName;
  link.click();
  await timeout(1);
  link.remove();
  URL.revokeObjectURL(imageData);
}

export const capturePageScreenshot = async (
  elementToCapture: HTMLElement,
  hideSelectors?: string[]
): Promise<string> => {
  try {
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = `${elementToCapture.scrollWidth}px`;
    tempContainer.style.height = `${elementToCapture.scrollHeight}px`;

    // Clone the element and its styles
    const clonedElement = elementToCapture.cloneNode(true) as HTMLElement;
    const computedStyle = window.getComputedStyle(elementToCapture);

    // Copy canvas contents
    const originalCanvases = elementToCapture.getElementsByTagName('canvas');
    const clonedCanvases = clonedElement.getElementsByTagName('canvas');

    Array.from(originalCanvases).forEach((originalCanvas, index) => {
      const clonedCanvas = clonedCanvases[index];
      if (clonedCanvas) {
        // Copy dimensions
        clonedCanvas.width = originalCanvas.width;
        clonedCanvas.height = originalCanvas.height;

        // Copy the content
        const context = clonedCanvas.getContext('2d');
        if (context) {
          context.drawImage(originalCanvas, 0, 0);
        }
      }
    });

    // Copy essential styles
    const stylesToCopy = [
      'width',
      'height',
      'padding',
      'margin',
      'background',
      'color',
      'font-family',
      'font-size'
    ];

    for (const property of stylesToCopy) {
      const value = computedStyle.getPropertyValue(property);
      if (value) {
        clonedElement.style.setProperty(property, value);
      }
    }

    // Hide specified elements in the clone
    if (hideSelectors) {
      for (const selector of hideSelectors) {
        const elements = clonedElement.querySelectorAll(selector);
        for (const element of elements) {
          if (element instanceof HTMLElement) {
            element.style.display = 'none';
          }
        }
      }
    }

    // Append clone to temporary container and add to document
    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    // Take screenshot
    const screenshot = await exportElementToImage(clonedElement);

    // Clean up
    document.body.removeChild(tempContainer);

    return screenshot;
  } catch (error) {
    console.error('Error capturing page screenshot:', error);
    throw error;
  }
};
