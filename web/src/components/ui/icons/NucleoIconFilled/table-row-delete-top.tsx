import React from 'react';

import type { iconProps } from './iconProps';

function tableRowDeleteTop(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table row delete top';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.47,5.78c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l1.47-1.47,1.47,1.47c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.47-1.47,1.47-1.47c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-1.47,1.47-1.47-1.47c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.47,1.47-1.47,1.47c-.293,.293-.293,.768,0,1.061Z"
          fill="currentColor"
        />
        <path
          d="M13.25,2.25h-.468c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.468c.689,0,1.25,.561,1.25,1.25v4H3.5V5c0-.689,.561-1.25,1.25-1.25h.468c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.468c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V5c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableRowDeleteTop;
