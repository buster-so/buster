import React from 'react';

import type { iconProps } from './iconProps';

function hashtag(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px hashtag';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.25,4.441H1.59c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h9.66c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.41,9.061H.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h9.66c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2.884,12.001c-.046,0-.092-.004-.139-.013-.407-.077-.675-.468-.599-.875L4.114.613c.076-.407.464-.677.875-.599.407.077.675.468.599.875l-1.969,10.5c-.068.36-.383.612-.736.612Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m7.149,12.001c-.046,0-.092-.004-.139-.013-.407-.077-.675-.468-.599-.875L8.38.613c.076-.407.464-.677.875-.599.407.077.675.468.599.875l-1.969,10.5c-.068.36-.383.612-.736.612Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default hashtag;
