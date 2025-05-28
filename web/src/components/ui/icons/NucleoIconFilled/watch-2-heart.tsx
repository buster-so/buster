import React from 'react';

import type { iconProps } from './iconProps';

function watch2Heart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px watch 2 heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,3.5H5.75c-1.517,0-2.75,1.233-2.75,2.75v5.5c0,1.517,1.233,2.75,2.75,2.75h6.5c1.517,0,2.75-1.233,2.75-2.75V6.25c0-1.517-1.233-2.75-2.75-2.75Zm-3.048,8.449c-.127,.068-.276,.068-.403,0-.673-.358-2.798-1.655-2.798-3.763-.003-.926,.73-1.68,1.64-1.686,.547,.007,1.056,.288,1.36,.751,.304-.463,.813-.744,1.36-.751,.91,.006,1.643,.76,1.64,1.686,0,2.109-2.125,3.406-2.798,3.763Z"
          fill="currentColor"
        />
        <path
          d="M12,2.5H6c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12,17H6c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default watch2Heart;
