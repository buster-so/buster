import React from 'react';

import type { iconProps } from './iconProps';

function focusMode(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px focus mode';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6,16.352c-.104,0-.209-.021-.31-.067-2.849-1.297-4.689-4.156-4.689-7.285S2.841,3.012,5.689,1.715c.377-.172,.821-.005,.993,.372,.171,.377,.005,.822-.372,.993-2.315,1.054-3.811,3.377-3.811,5.919s1.496,4.866,3.811,5.919c.377,.171,.543,.616,.372,.993-.126,.276-.398,.439-.683,.439Z"
          fill="currentColor"
        />
        <path
          d="M12,16.352c-.285,0-.557-.163-.683-.439-.171-.377-.005-.822,.372-.993,2.315-1.054,3.811-3.377,3.811-5.919s-1.496-4.866-3.811-5.919c-.377-.171-.543-.616-.372-.993,.173-.376,.618-.543,.993-.372,2.849,1.297,4.689,4.156,4.689,7.285s-1.841,5.988-4.689,7.285c-.101,.046-.206,.067-.31,.067Z"
          fill="currentColor"
        />
        <circle cx="9" cy="9" fill="currentColor" r="4" />
      </g>
    </svg>
  );
}

export default focusMode;
