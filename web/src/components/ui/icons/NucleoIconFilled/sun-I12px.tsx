import React from 'react';

import type { iconProps } from './iconProps';

function sun(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sun';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,3c.414,0,.75-.336,.75-.75V1.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.773,4.977c.192,0,.384-.073,.53-.22l.707-.707c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-.707,.707c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M16.75,8.25h-1c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M14.303,13.243c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.707,.707c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-.707-.707Z"
          fill="currentColor"
        />
        <path
          d="M9,15c-.414,0-.75,.336-.75,.75v1c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M3.697,13.243l-.707,.707c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l.707-.707c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
        <path
          d="M3,9c0-.414-.336-.75-.75-.75H1.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1c.414,0,.75-.336,.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M3.697,4.757c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-.707-.707c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.707,.707Z"
          fill="currentColor"
        />
        <circle cx="9" cy="9" fill="currentColor" r="5" />
      </g>
    </svg>
  );
}

export default sun;
