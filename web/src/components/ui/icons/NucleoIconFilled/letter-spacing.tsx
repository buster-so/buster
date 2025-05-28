import React from 'react';

import type { iconProps } from './iconProps';

function letterSpacing(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px letter spacing';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.269,12.979l-3.297-8.5c-.112-.289-.39-.479-.699-.479h-.546c-.31,0-.587,.19-.699,.479l-3.297,8.5c-.15,.386,.042,.82,.428,.97,.382,.148,.82-.042,.97-.428l.784-2.021h4.173l.784,2.021c.115,.297,.399,.479,.699,.479,.09,0,.182-.016,.271-.051,.386-.15,.578-.584,.428-.97Zm-5.774-2.979l1.505-3.88,1.505,3.88h-3.01Z"
          fill="currentColor"
        />
        <path
          d="M15.75,16c-.414,0-.75-.336-.75-.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V15.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M2.25,16c-.414,0-.75-.336-.75-.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V15.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default letterSpacing;
