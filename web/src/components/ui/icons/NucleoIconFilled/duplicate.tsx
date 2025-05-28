import React from 'react';

import type { iconProps } from './iconProps';

function duplicate(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px duplicate';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="12.5" width="12.5" fill="currentColor" rx="2.75" ry="2.75" x="4.5" y="4.5" />
        <path
          d="M2.801,12.748c-.365,0-.686-.268-.741-.64L1.03,5.184c-.108-.727,.073-1.452,.511-2.042,.437-.59,1.078-.975,1.805-1.083l6.924-1.029c1.259-.187,2.477,.507,2.954,1.689,.155,.384-.03,.821-.415,.976-.381,.156-.82-.03-.976-.415-.217-.537-.768-.854-1.343-.767L3.566,3.543c-.33,.049-.622,.224-.82,.492-.199,.268-.281,.598-.231,.928l1.029,6.924c.061,.41-.223,.792-.632,.852-.037,.006-.074,.008-.111,.008Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default duplicate;
