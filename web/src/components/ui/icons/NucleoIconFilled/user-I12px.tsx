import React from 'react';

import type { iconProps } from './iconProps';

function user(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M9,9c-2.764,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.591,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769s3.369-.259,4.987-.769c.622-.196,1.132-.648,1.399-1.239,.262-.58,.265-1.245,.008-1.825-1.121-2.531-3.631-4.167-6.395-4.167Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default user;
