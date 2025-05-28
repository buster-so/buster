import React from 'react';

import type { iconProps } from './iconProps';

function doubleChevronUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px double chevron up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.53,3.47c-.293-.293-.768-.293-1.061,0L4.22,7.72c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l3.72-3.72,3.72,3.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061L9.53,3.47Z"
          fill="currentColor"
        />
        <path
          d="M9.53,8.22c-.293-.293-.768-.293-1.061,0l-4.25,4.25c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l3.72-3.72,3.72,3.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-4.25-4.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default doubleChevronUp;
