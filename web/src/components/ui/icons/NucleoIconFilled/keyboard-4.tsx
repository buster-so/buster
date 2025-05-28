import React from 'react';

import type { iconProps } from './iconProps';

function keyboard4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px keyboard 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,4H3.75c-1.517,0-2.75,1.233-2.75,2.75v4.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V6.75c0-1.517-1.233-2.75-2.75-2.75Zm-4.625,3.5c0-.276,.224-.5,.5-.5h.5c.276,0,.5,.224,.5,.5v.5c0,.276-.224,.5-.5,.5h-.5c-.276,0-.5-.224-.5-.5v-.5Zm-2.75,0c0-.276,.224-.5,.5-.5h.5c.276,0,.5,.224,.5,.5v.5c0,.276-.224,.5-.5,.5h-.5c-.276,0-.5-.224-.5-.5v-.5Zm-1.25,.5c0,.276-.224,.5-.5,.5h-.5c-.276,0-.5-.224-.5-.5v-.5c0-.276,.224-.5,.5-.5h.5c.276,0,.5,.224,.5,.5v.5Zm5.625,3H6.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h4.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm2.625-3c0,.276-.224,.5-.5,.5h-.5c-.276,0-.5-.224-.5-.5v-.5c0-.276,.224-.5,.5-.5h.5c.276,0,.5,.224,.5,.5v.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default keyboard4;
