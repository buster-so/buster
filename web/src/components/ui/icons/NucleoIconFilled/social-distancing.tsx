import React from 'react';

import type { iconProps } from './iconProps';

function socialDistancing(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px social distancing';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="4.25" cy="4.25" fill="currentColor" r="2.25" />
        <circle cx="13.75" cy="4.25" fill="currentColor" r="2.25" />
        <path
          d="M6.632,10.375c.208,.359,.667,.481,1.025,.274s.481-.666,.274-1.025c-.758-1.311-2.168-2.125-3.681-2.125C1.907,7.5,0,9.407,0,11.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-1.517,1.234-2.75,2.75-2.75,.979,0,1.892,.527,2.382,1.375Z"
          fill="currentColor"
        />
        <path
          d="M13.75,7.5c-1.513,0-2.923,.814-3.681,2.125-.207,.359-.084,.817,.274,1.025,.358,.208,.818,.085,1.025-.274,.49-.849,1.403-1.375,2.382-1.375,1.516,0,2.75,1.233,2.75,2.75,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-2.343-1.907-4.25-4.25-4.25Z"
          fill="currentColor"
        />
        <path
          d="M13.28,10.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.72,.72H5.061l.72-.72c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-2,2c-.293,.293-.293,.768,0,1.061l2,2c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-.72-.72h7.879l-.72,.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2-2c.293-.293,.293-.768,0-1.061l-2-2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default socialDistancing;
