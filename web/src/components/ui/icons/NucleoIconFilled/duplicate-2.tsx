import React from 'react';

import type { iconProps } from './iconProps';

function duplicate2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px duplicate 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="12.5" width="12.5" fill="currentColor" rx="2.75" ry="2.75" x="1" y="1" />
        <path
          d="M7.32,17c-1.108,0-2.119-.667-2.544-1.72-.155-.384,.03-.821,.415-.976,.383-.155,.82,.03,.976,.415,.217,.537,.768,.852,1.343,.767l6.924-1.029c.33-.049,.622-.224,.82-.492,.199-.268,.281-.598,.231-.928l-1.029-6.924c-.061-.41,.223-.792,.632-.852,.403-.062,.791,.222,.853,.631l1.029,6.924c.108,.727-.073,1.452-.511,2.042-.437,.59-1.078,.975-1.805,1.083l-6.924,1.029c-.138,.021-.274,.031-.41,.031Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default duplicate2;
