import React from 'react';

import type { iconProps } from './iconProps';

function cloudUpload2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud upload 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12,13.75h.5c2.071,0,3.75-1.679,3.75-3.75,0-1.736-1.185-3.182-2.786-3.609-.186-2.314-2.102-4.141-4.464-4.141-2.485,0-4.5,2.015-4.5,4.5,0,.35,.049,.686,.124,1.013-1.597,.067-2.874,1.374-2.874,2.987,0,1.657,1.343,3,3,3h1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 10.5L9 8.25 11.25 10.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 8.25L9 17.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default cloudUpload2;
