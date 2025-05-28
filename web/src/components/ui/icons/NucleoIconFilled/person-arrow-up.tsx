import React from 'react';

import type { iconProps } from './iconProps';

function personArrowUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px person arrow up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="5.75" cy="2.5" fill="currentColor" r="2.5" />
        <path
          d="M8.896,7.346c-.201-.638-.737-1.1-1.4-1.206-1.152-.182-2.341-.182-3.488,0-.664,.104-1.2,.562-1.4,1.195l-1.169,3.703c-.103,.324-.071,.667,.089,.964,.161,.299,.43,.515,.758,.609l.742,.212,.176,3.513c.046,.933,.814,1.663,1.748,1.663h1.598c.934,0,1.701-.73,1.748-1.663l.176-3.514,.739-.211c.328-.093,.597-.31,.758-.61,.162-.3,.194-.644,.091-.969l-1.164-3.688Z"
          fill="currentColor"
        />
        <path
          d="M14.78,4.47c-.293-.293-.768-.293-1.061,0l-2.25,2.25c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l.97-.97v6.189c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V6.811l.97,.97c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.25-2.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default personArrowUp;
