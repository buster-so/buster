import React from 'react';

import type { iconProps } from './iconProps';

function openCircleBolt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px open circle bolt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.765,2.803c2.089,1.272,3.485,3.572,3.485,6.197,0,2.734-1.513,5.114-3.747,6.349"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.235,15.197c-2.089-1.272-3.485-3.572-3.485-6.197,0-2.734,1.513-5.114,3.747-6.349"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.494,1.851l-4.682,7.874c-.138,.231,.029,.524,.298,.524h3.89l-.855,5.77c-.031,.212,.252,.312,.361,.128l4.682-7.874c.138-.231-.029-.524-.298-.524h-3.89l.855-5.77c.031-.212-.252-.312-.361-.128Z"
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

export default openCircleBolt;
