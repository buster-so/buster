import { renderToString } from 'react-dom/server';
import type { BusterChartLegendItem } from './interfaces';
import { LegendItem } from './LegendItem';

const WIDTH_OF_OVERFLOW = 79;

export const computeHiddenShowItems = (legendItems: BusterChartLegendItem[], width: number) => {
  if (width === 0 || !legendItems || legendItems.length === 0) {
    return {
      shownItems: [],
      hiddenItems: []
    };
  }

  let itemsWidth = 0;
  const containerWidth = width - WIDTH_OF_OVERFLOW;
  const measurementDiv = document.createElement('div');
  measurementDiv.style.position = 'absolute';
  measurementDiv.style.opacity = '0';
  measurementDiv.style.pointerEvents = 'none';
  measurementDiv.style.top = '0';
  measurementDiv.style.left = '0';

  document.body.appendChild(measurementDiv);

  const shownItems = legendItems.reduce<BusterChartLegendItem[]>((acc, item, index) => {
    const html = renderToString(<LegendItem item={item} />);
    measurementDiv.innerHTML = html;

    const itemWidth = measurementDiv.getBoundingClientRect().width;
    const spacing = index !== 0 ? 8 : 0;
    itemsWidth += itemWidth + spacing;

    if (itemsWidth <= containerWidth) {
      acc.push(item);
    }
    return acc;
  }, []);

  document.body.removeChild(measurementDiv);

  const hiddenItems = legendItems?.filter((item) => !shownItems.includes(item));

  return { shownItems, hiddenItems };
};
