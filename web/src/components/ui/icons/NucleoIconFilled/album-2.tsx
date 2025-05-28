import React from 'react';

import type { iconProps } from './iconProps';

function album2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px album 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.75,2h6.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H5.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M3.75,5H14.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.328,7.192c-.334-.44-.842-.692-1.394-.692H3.065c-.552,0-1.06,.252-1.394,.692-.334,.439-.44,.996-.292,1.526l1.944,7c.209,.754,.902,1.282,1.686,1.282h7.98c.783,0,1.477-.527,1.686-1.282l1.944-6.999c.148-.532,.042-1.088-.292-1.527Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default album2;
