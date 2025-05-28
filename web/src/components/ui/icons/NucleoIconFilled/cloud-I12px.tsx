import React from 'react';

import type { iconProps } from './iconProps';

function cloud(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.157,6.326c-1.524-.602-3.389-.296-4.63,.819-.142,.128-.32,.191-.498,.191-.205,0-.409-.084-.557-.249-.275-.309-.25-.783,.058-1.059,1.347-1.211,3.233-1.702,4.993-1.42-.913-1.561-2.601-2.608-4.494-2.608-2.885,0-5.231,2.355-5.231,5.25,0,.125,.005,.25,.016,.377-1.645,.418-2.849,1.934-2.812,3.707,.021,1,.429,1.931,1.148,2.624,.7,.674,1.613,1.042,2.565,1.042,.026,0,.053,0,.079,0h7.722c2.473,0,4.484-2.018,4.484-4.501-.003-1.859-1.131-3.496-2.843-4.173Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cloud;
