import React from 'react';

import type { iconProps } from './iconProps';

function brightnessDecrease(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px brightness decrease';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,2.5c.414,0,.75-.336,.75-.75v-.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v.25c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.773,3.167l-.177,.177c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l.177-.177c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
        <path
          d="M16.5,8.25h-.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M14.657,13.596c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.177,.177c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-.177-.177Z"
          fill="currentColor"
        />
        <path
          d="M9,15.5c-.414,0-.75,.336-.75,.75v.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.25c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M3.343,13.596l-.177,.177c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l.177-.177c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
        <path
          d="M1.75,8.25h-.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M3.343,4.404c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-.177-.177c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.177,.177Z"
          fill="currentColor"
        />
        <circle cx="9" cy="9" fill="currentColor" r="5" />
      </g>
    </svg>
  );
}

export default brightnessDecrease;
