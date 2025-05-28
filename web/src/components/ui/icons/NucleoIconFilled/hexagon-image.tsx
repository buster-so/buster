import React from 'react';

import type { iconProps } from './iconProps';

function hexagonImage(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hexagon image';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="6.75" cy="7.25" fill="currentColor" r="1.25" />
        <path
          d="M13.194,8.384c-1.072-1.072-2.816-1.072-3.889,0l-5.008,5.009,.499,.861c.358,.617,1.017,.997,1.73,.997h4.946c.713,0,1.372-.38,1.73-.997l2.151-3.709-2.16-2.16Z"
          fill="currentColor"
        />
        <path
          d="M11.473,16H6.527c-.977,0-1.888-.525-2.378-1.37L1.683,10.38c-.493-.851-.493-1.909,0-2.76L4.148,3.37c.491-.845,1.402-1.37,2.379-1.37h4.946c.977,0,1.888,.525,2.378,1.37l2.465,4.25c.493,.851,.493,1.909,0,2.76l-2.465,4.25c-.491,.845-1.402,1.37-2.379,1.37ZM6.527,3.5c-.444,0-.858,.239-1.082,.623l-2.464,4.25c-.225,.387-.225,.867,0,1.254l2.465,4.25c.223,.384,.637,.623,1.081,.623h4.946c.444,0,.858-.239,1.082-.623l2.464-4.25c.225-.387,.225-.867,0-1.254l-2.465-4.25c-.223-.384-.637-.623-1.081-.623H6.527Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default hexagonImage;
