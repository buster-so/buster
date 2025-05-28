import React from 'react';

import type { iconProps } from './iconProps';

function label2Slash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px label 2 slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.38,14.62L14.093,3.907l-.21-.259c-.334-.412-.83-.648-1.36-.648H4.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.015,.559,1.894,1.38,2.37Z"
          fill="currentColor"
        />
        <path
          d="M15.516,5.666L6.182,15h6.341c.53,0,1.026-.236,1.36-.649l3.95-4.879c.223-.275,.223-.668,0-.943l-2.317-2.863Z"
          fill="currentColor"
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default label2Slash;
