import React from 'react';

import type { iconProps } from './iconProps';

function photos(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px photos';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.221,3.638c.879-.635,2.114-.556,2.906,.235h0c.792,.792,.87,2.026,.235,2.906"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.362,11.221c.635,.879,.556,2.114-.235,2.906h0c-.792,.792-2.026,.87-2.906,.235"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.779,14.362c-.879,.635-2.114,.556-2.906-.235h0c-.792-.792-.87-2.026-.235-2.906"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.638,6.779c-.635-.879-.556-2.114,.235-2.906h0c.792-.792,2.026-.87,2.906-.235"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="6"
          width="4.5"
          fill="none"
          rx="2.25"
          ry="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="6.75"
          y="1.75"
        />
        <rect
          height="6"
          width="4.5"
          fill="none"
          rx="2.25"
          ry="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 13.25 9)"
          x="11"
          y="6"
        />
        <rect
          height="6"
          width="4.5"
          fill="none"
          rx="2.25"
          ry="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 9 13.25)"
          x="6.75"
          y="10.25"
        />
        <rect
          height="6"
          width="4.5"
          fill="none"
          rx="2.25"
          ry="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 4.75 9)"
          x="2.5"
          y="6"
        />
      </g>
    </svg>
  );
}

export default photos;
