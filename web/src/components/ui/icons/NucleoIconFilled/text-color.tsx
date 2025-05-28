import React from 'react';

import type { iconProps } from './iconProps';

function textColor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text color';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.269,9.979L9.972,1.479c-.112-.289-.39-.479-.699-.479h-.546c-.31,0-.587,.19-.699,.479l-3.297,8.5c-.15,.386,.042,.82,.428,.97,.383,.148,.82-.042,.97-.428l.784-2.021h4.173l.784,2.021c.115,.297,.399,.479,.699,.479,.09,0,.182-.016,.271-.051,.386-.15,.578-.584,.428-.97Zm-5.774-2.979l1.505-3.88,1.505,3.88h-3.01Z"
          fill="currentColor"
        />
        <rect height="5" width="16" fill="currentColor" rx="1.75" ry="1.75" x="1" y="12" />
      </g>
    </svg>
  );
}

export default textColor;
