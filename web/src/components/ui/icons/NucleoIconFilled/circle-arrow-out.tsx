import React from 'react';

import type { iconProps } from './iconProps';

function circleArrowOut(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle arrow out';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1c-1.611,0-3.165,.477-4.493,1.38-.342,.233-.431,.699-.198,1.042,.234,.343,.7,.432,1.042,.198,1.078-.733,2.34-1.12,3.649-1.12,3.584,0,6.5,2.916,6.5,6.5s-2.916,6.5-6.5,6.5c-1.309,0-2.571-.387-3.649-1.12-.343-.232-.809-.145-1.042,.198s-.144,.809,.198,1.042c1.328,.903,2.881,1.38,4.493,1.38,4.411,0,8-3.589,8-8S13.411,1,9,1Z"
          fill="currentColor"
        />
        <path
          d="M5,13c.192,0,.384-.073,.53-.22,.293-.293,.293-.768,0-1.061l-1.97-1.97h7.689c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.561l1.97-1.97c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-3.25,3.25c-.293,.293-.293,.768,0,1.061l3.25,3.25c.146,.146,.338,.22,.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleArrowOut;
