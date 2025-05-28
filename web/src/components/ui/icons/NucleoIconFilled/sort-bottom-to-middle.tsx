import React from 'react';

import type { iconProps } from './iconProps';

function sortBottomToMiddle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sort bottom to middle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.75,3H2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H15.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M2.25,9.75H6.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.125,8.25h-2.064l.97-.97c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-2.25,2.25c-.293,.293-.293,.768,0,1.061l2.25,2.25c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-.97-.97h2.064c1.034,0,1.875,.841,1.875,1.875s-.841,1.875-1.875,1.875H2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H13.125c1.861,0,3.375-1.514,3.375-3.375s-1.514-3.375-3.375-3.375Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sortBottomToMiddle;
