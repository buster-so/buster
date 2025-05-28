import React from 'react';

import type { iconProps } from './iconProps';

function explodingHead(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px exploding head';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.25,10c0,4.004-3.246,7.25-7.25,7.25-4.004,0-7.25-3.246-7.25-7.25l1.394,.697c.366,.183,.806,.125,1.112-.147l1.167-1.037c.34-.302,.841-.337,1.219-.085l1.803,1.202c.336,.224,.774,.224,1.109,0l1.803-1.202c.378-.252,.879-.217,1.219,.085l1.167,1.037c.306,.272,.746,.33,1.112,.147l1.394-.697Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8,13h2c.276,0,.5,.224,.5,.5h0c0,.828-.672,1.5-1.5,1.5h0c-.828,0-1.5-.672-1.5-1.5h0c0-.276,.224-.5,.5-.5Z"
          fill="currentColor"
          transform="rotate(180 9 14)"
        />
        <path
          d="M10.25,7.75c0-1.105,.895-2,2-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.25,7.75c0-1.105,.895-2,2-2h.75c1.243,0,2.25-1.007,2.25-2.25,0-1.243-1.007-2.25-2.25-2.25-.675,0-1.274,.303-1.686,.774-.488-.764-1.34-1.274-2.314-1.274-.974,0-1.825,.51-2.314,1.274-.412-.471-1.011-.774-1.686-.774-1.243,0-2.25,1.007-2.25,2.25s1.007,2.25,2.25,2.25h.75c1.105,0,2,.895,2,2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.646,4.25c-.326,1.154-1.388,2-2.646,2-1.259,0-2.32-.846-2.646-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="12" fill="currentColor" r="1" />
        <circle cx="2.25" cy="6.75" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="7.75" fill="currentColor" r=".75" />
        <circle cx="12" cy="12" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default explodingHead;
