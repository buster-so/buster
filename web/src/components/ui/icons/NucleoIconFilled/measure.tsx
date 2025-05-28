import React from 'react';

import type { iconProps } from './iconProps';

function measure(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px measure';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,7h-5.25v-1.25c0-1.568-1.935-2.75-4.5-2.75S1,4.182,1,5.75v6.5c0,1.568,1.935,2.75,4.5,2.75v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25h2v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25h2v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25h1.25c.965,0,1.75-.785,1.75-1.75v-4.5c0-.965-.785-1.75-1.75-1.75Zm-9.75,0c-1.804,0-3-.752-3-1.25s1.196-1.25,3-1.25,3,.752,3,1.25-1.196,1.25-3,1.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default measure;
