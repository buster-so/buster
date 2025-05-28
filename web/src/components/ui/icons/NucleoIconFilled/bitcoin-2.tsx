import React from 'react';

import type { iconProps } from './iconProps';

function bitcoin2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bitcoin 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.795,8.409c.433-.52,.705-1.18,.705-1.909,0-1.654-1.346-3-3-3h-.5V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.5V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75V13h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.5v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.25c1.792,0,3.25-1.458,3.25-3.25,0-1.23-.695-2.29-1.705-2.841Zm-2.295-3.409c.827,0,1.5,.673,1.5,1.5s-.673,1.5-1.5,1.5h-3.5v-3h3.5Zm.75,8H7v-3.5h4.25c.965,0,1.75,.785,1.75,1.75s-.785,1.75-1.75,1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bitcoin2;
