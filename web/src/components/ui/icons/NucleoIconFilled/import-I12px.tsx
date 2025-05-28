import React from 'react';

import type { iconProps } from './iconProps';

function importIcon(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px import';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.75,6h-3v5.439l1.72-1.72c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-3,3c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-3-3c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.72,1.72V6h-3c-1.517,0-2.75,1.233-2.75,2.75v5.5c0,1.517,1.233,2.75,2.75,2.75h7.5c1.517,0,2.75-1.233,2.75-2.75v-5.5c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M9.75,6.048V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V6.048h1.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default importIcon;
