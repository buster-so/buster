import React from 'react';

import type { iconProps } from './iconProps';

function suitcaseClip(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase clip';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,5.5c-.414,0-.75-.336-.75-.75V2.25c0-.138-.112-.25-.25-.25h-3.5c-.138,0-.25,.112-.25,.25v2.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2.25c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9.5,14.75v-2.5c0-1.93,1.57-3.5,3.5-3.5,1.333,0,2.496,.75,3.086,1.85,.21-.065,.433-.1,.664-.1,.086,0,.167,.016,.25,.025v-3.775c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h5.938c-.11-.401-.188-.814-.188-1.25Z"
          fill="currentColor"
        />
        <path
          d="M16.75,12c-.414,0-.75,.336-.75,.75v2c0,.965-.785,1.75-1.75,1.75s-1.75-.785-1.75-1.75v-2.5c0-.276,.224-.5,.5-.5s.5,.224,.5,.5v2c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2c0-1.103-.897-2-2-2s-2,.897-2,2v2.5c0,1.792,1.458,3.25,3.25,3.25s3.25-1.458,3.25-3.25v-2c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default suitcaseClip;
