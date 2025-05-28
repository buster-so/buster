import React from 'react';

import type { iconProps } from './iconProps';

function objsGroup(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px objs group';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm1.25,11.25c0,.689-.561,1.25-1.25,1.25H4.75c-.689,0-1.25-.561-1.25-1.25V4.75c0-.689,.561-1.25,1.25-1.25H13.25c.689,0,1.25,.561,1.25,1.25V13.25Z"
          fill="currentColor"
        />
        <path
          d="M12.75,7.5h-1c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.25v3h-3v-.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1c0,.414,.336,.75,.75,.75h4.5c.414,0,.75-.336,.75-.75v-4.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <rect height="6" width="6" fill="currentColor" rx=".75" ry=".75" x="4.5" y="4.5" />
      </g>
    </svg>
  );
}

export default objsGroup;
