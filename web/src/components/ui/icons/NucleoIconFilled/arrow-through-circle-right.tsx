import React from 'react';

import type { iconProps } from './iconProps';

function arrowThroughCircleRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow through circle right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.78,8.47l-3-3c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.72,1.72h-3.689c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.689l-1.72,1.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3-3c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <path
          d="M2.5,9c0-.257,.038-.503,.076-.75H.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.826c-.038-.247-.076-.493-.076-.75Z"
          fill="currentColor"
        />
        <path
          d="M7.5,4c-2.5,0-4.559,1.851-4.924,4.25H7.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H2.576c.365,2.399,2.424,4.25,4.924,4.25,2.757,0,5-2.243,5-5s-2.243-5-5-5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowThroughCircleRight;
