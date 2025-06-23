import type { MouseEventHandler } from 'react';
import { useMemoizedFn } from '@/hooks';

//I hate this. It feels soo hacky
export const useEditAppSegmented = ({
  onClick: onClickExternal
}: {
  onClick: (value: string) => void;
}) => {
  //There was a bug here so I have to use this janky onClick
  const onClick = useMemoizedFn<MouseEventHandler<HTMLDivElement>>((e) => {
    let dataValue = (e.target as HTMLSpanElement).getAttribute('data-value');

    if (!dataValue) {
      const element = e.target as HTMLElement;
      const childWithDataValue = element.querySelector('[data-value]');

      if (childWithDataValue) {
        dataValue = childWithDataValue.getAttribute('data-value');
      }
    }

    if (!dataValue) {
      const parent = (e.target as HTMLElement).closest('.busterv2-segmented-item-label');
      if (parent) {
        const childWithDataValue = parent.querySelector('[data-value]');
        if (childWithDataValue) {
          dataValue = childWithDataValue.getAttribute('data-value');
        }
      }
    }

    if (dataValue) {
      return onClickExternal(dataValue);
    }
  });

  return { onClick };
};
