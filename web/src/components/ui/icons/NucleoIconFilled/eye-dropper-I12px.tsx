import React from 'react';

import type { iconProps } from './iconProps';

function eyeDropper(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px eye dropper';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.651,2.348c-.998-.998-2.739-.998-3.737,0l-2.503,2.503-1.131-1.131c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l6,6c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.131-1.131,2.502-2.502c1.03-1.03,1.03-2.708,0-3.738Z"
          fill="currentColor"
        />
        <path
          d="M2.596,11.667c-.845,.845-.985,2.12-.444,3.121l-.932,.931c-.293,.292-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22,.191,0,.384-.073,.53-.22l.931-.931c.382,.208,.807,.329,1.254,.329,.706,0,1.369-.275,1.868-.774l4.695-4.695-3.738-3.737L2.596,11.667Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default eyeDropper;
