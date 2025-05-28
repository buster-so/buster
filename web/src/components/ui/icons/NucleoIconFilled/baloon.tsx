import React from 'react';

import type { iconProps } from './iconProps';

function baloon(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px baloon';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.655,18c-.192,0-.384-.073-.53-.22-.723-.723-.723-1.898,0-2.621l.372-.376c.141-.141,.141-.365,.003-.503-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0c.723,.723,.723,1.898,0,2.621l-.372,.376c-.141,.141-.141,.365-.003,.503,.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M9,1c-3.309,0-6,3.028-6,6.75s2.691,6.75,6,6.75,6-3.028,6-6.75S12.309,1,9,1Zm0,4c-1.065,0-2,1.285-2,2.75,0,.414-.336,.75-.75,.75s-.75-.336-.75-.75c0-2.304,1.603-4.25,3.5-4.25,.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default baloon;
