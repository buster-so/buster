import React from 'react';

import type { iconProps } from './iconProps';

function bomb2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bomb 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.34,4.158l.72-.72c.486-.486,1.274-.486,1.76,0l.88,.88c.417,.417,1.057,.476,1.537,.177"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.5,5.657c-.256-.435-.643-.993-1.212-1.551-.519-.509-1.033-.864-1.445-1.106l-1.333,1.333c-.759-.37-1.609-.583-2.51-.583C3.824,3.75,1.25,6.324,1.25,9.5s2.574,5.75,5.75,5.75,5.75-2.574,5.75-5.75c0-.901-.213-1.751-.583-2.51,.534-.533,.799-.799,1.333-1.333Z"
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

export default bomb2;
