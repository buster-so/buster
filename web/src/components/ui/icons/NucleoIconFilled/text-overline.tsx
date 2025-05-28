import React from 'react';

import type { iconProps } from './iconProps';

function textOverline(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text overline';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.689,14.979l-3.685-9.5c-.112-.289-.39-.479-.699-.479h-.61c-.31,0-.587,.19-.699,.479l-3.685,9.5c-.15,.386,.042,.82,.428,.97,.384,.148,.82-.042,.97-.428l.784-2.021h5.014l.784,2.021c.115,.297,.399,.479,.699,.479,.09,0,.182-.016,.271-.051,.386-.15,.578-.584,.428-.97Zm-6.615-2.979l1.925-4.963,1.925,4.963h-3.85Z"
          fill="currentColor"
        />
        <path
          d="M15.25,3.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default textOverline;
