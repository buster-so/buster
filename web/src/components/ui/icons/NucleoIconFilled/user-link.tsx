import React from 'react';

import type { iconProps } from './iconProps';

function userLink(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user link';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M12.25,17.5h-.5c-1.24,0-2.25-1.009-2.25-2.25v-1c0-1.241,1.01-2.25,2.25-2.25h.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-.5c-.413,0-.75,.336-.75,.75v1c0,.414,.337,.75,.75,.75h.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,17.5h-.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.5c.413,0,.75-.336,.75-.75v-1c0-.414-.337-.75-.75-.75h-.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.5c1.24,0,2.25,1.009,2.25,2.25v1c0,1.241-1.01,2.25-2.25,2.25Z"
          fill="currentColor"
        />
        <path
          d="M8,15.25v-1c0-2.068,1.683-3.75,3.75-3.75h1.546c-1.206-.944-2.704-1.5-4.296-1.5-2.765,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.592,.777,1.043,1.399,1.239,1.44,.454,2.928,.697,4.429,.748-.273-.52-.442-1.102-.442-1.729Z"
          fill="currentColor"
        />
        <path
          d="M14.25,15.5h-1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userLink;
