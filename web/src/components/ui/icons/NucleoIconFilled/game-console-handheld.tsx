import React from 'react';

import type { iconProps } from './iconProps';

function gameConsoleHandheld(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px game console handheld';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,1.5H4.75c-.965,0-1.75,.785-1.75,1.75V14.75c0,.965,.785,1.75,1.75,1.75h6.5c2.068,0,3.75-1.682,3.75-3.75V3.25c0-.965-.785-1.75-1.75-1.75Zm-4.75,11.5h-.5v.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-.5h-.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.5v-.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v.5h.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm2.75,1c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm1-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm.75-3.75c0,.414-.336,.75-.75,.75H5.75c-.414,0-.75-.336-.75-.75V4.25c0-.414,.336-.75,.75-.75h6.5c.414,0,.75,.336,.75,.75v4Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default gameConsoleHandheld;
