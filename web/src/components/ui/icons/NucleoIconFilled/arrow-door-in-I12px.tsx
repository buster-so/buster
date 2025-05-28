import React from 'react';

import type { iconProps } from './iconProps';

function arrowDoorIn(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow door in';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.75,1.5h-6.5c-.965,0-1.75,.785-1.75,1.75v2.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.25c0-.138,.112-.25,.25-.25h5.302l-1.724,1.069c-.518,.321-.828,.877-.828,1.487v6.887c0,.61,.31,1.166,.828,1.487l1.724,1.069h-5.302c-.138,0-.25-.112-.25-.25v-2.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.5c0,.965,.785,1.75,1.75,1.75h6.5c.965,0,1.75-.785,1.75-1.75V3.25c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
        <path
          d="M7.28,8.47l-2.75-2.75c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.47,1.47H.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H4.939l-1.47,1.47c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowDoorIn;
