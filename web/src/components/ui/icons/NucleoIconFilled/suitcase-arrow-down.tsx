import React from 'react';

import type { iconProps } from './iconProps';

function suitcaseArrowDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase arrow down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,5.5c-.414,0-.75-.336-.75-.75V2.25c0-.138-.112-.25-.25-.25h-3.5c-.138,0-.25,.112-.25,.25v2.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2.25c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9.659,13.159c.425-.425,.99-.659,1.591-.659,.084,0,.168,.004,.25,.014v-.264c0-1.241,1.01-2.25,2.25-2.25s2.25,1.009,2.25,2.25v.264c.082-.009,.166-.014,.25-.014,.26,0,.511,.052,.75,.136V6.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h5.631c-.585-.874-.493-2.07,.278-2.841Z"
          fill="currentColor"
        />
        <path
          d="M15.72,14.22l-1.22,1.22v-3.189c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v3.189l-1.22-1.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.5,2.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.5-2.5c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default suitcaseArrowDown;
