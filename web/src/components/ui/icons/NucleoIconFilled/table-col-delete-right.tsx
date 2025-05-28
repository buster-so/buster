import React from 'react';

import type { iconProps } from './iconProps';

function tableColDeleteRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table col delete right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.28,6.47c-.293-.293-.768-.293-1.061,0l-1.47,1.47-1.47-1.47c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.47,1.47-1.47,1.47c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l1.47-1.47,1.47,1.47c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.47-1.47,1.47-1.47c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <path
          d="M15,12.032c-.414,0-.75,.336-.75,.75v.468c0,.689-.561,1.25-1.25,1.25h-4V3.5h4c.689,0,1.25,.561,1.25,1.25v.468c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.468c0-1.517-1.233-2.75-2.75-2.75H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13c1.517,0,2.75-1.233,2.75-2.75v-.468c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableColDeleteRight;
