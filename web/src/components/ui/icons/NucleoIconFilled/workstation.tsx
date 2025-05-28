import React from 'react';

import type { iconProps } from './iconProps';

function workstation(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px workstation';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.75,9.5H2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.851l-.839,4.616c-.074,.408,.196,.798,.604,.872,.045,.008,.091,.012,.135,.012,.355,0,.671-.254,.737-.616l.888-4.884h6.748l.888,4.884c.066,.362,.381,.616,.737,.616,.044,0,.09-.004,.135-.012,.407-.074,.678-.464,.604-.872l-.839-4.616h1.851c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M11.25,1H6.75c-.965,0-1.75,.785-1.75,1.75v2.5c0,.965,.785,1.75,1.75,1.75h1.5v.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.75h1.5c.965,0,1.75-.785,1.75-1.75V2.75c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,7.25c-.69,0-1.25,.56-1.25,1.25h2.5c0-.69-.56-1.25-1.25-1.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default workstation;
