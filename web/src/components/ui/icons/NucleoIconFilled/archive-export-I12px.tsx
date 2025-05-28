import React from 'react';

import type { iconProps } from './iconProps';

function archiveExport(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px archive export';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.97,5.78c.293,.293,.768,.293,1.061,0l1.22-1.22v3.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.689l1.22,1.22c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.5-2.5c-.293-.293-.768-.293-1.061,0l-2.5,2.5c-.293,.293-.293,.768,0,1.061Z"
          fill="currentColor"
        />
        <path
          d="M13.25,2h-.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.5c.689,0,1.25,.561,1.25,1.25v4.75h-2.75c-.414,0-.75,.336-.75,.75v1.5c0,.138-.112,.25-.25,.25h-3.5c-.138,0-.25-.112-.25-.25v-1.5c0-.414-.336-.75-.75-.75H3.5V4.75c0-.689,.561-1.25,1.25-1.25h.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.5c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default archiveExport;
