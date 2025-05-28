import React from 'react';

import type { iconProps } from './iconProps';

function boxArchiveDownload(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px box archive download';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.659,15.341c-.877-.877-.877-2.305,0-3.182,.425-.425,.99-.659,1.591-.659,.084,0,.167,.004,.25,.014v-.264c0-1.241,1.009-2.25,2.25-2.25,.264,0,.514,.054,.75,.138v-2.164c.846-.123,1.5-.845,1.5-1.725v-1.5c0-.965-.785-1.75-1.75-1.75H2.75c-.965,0-1.75,.785-1.75,1.75v1.5c0,.879,.654,1.602,1.5,1.725v6.275c0,1.517,1.233,2.75,2.75,2.75h6.068l-.659-.659ZM2.75,5.5c-.138,0-.25-.112-.25-.25v-1.5c0-.138,.112-.25,.25-.25H15.25c.138,0,.25,.112,.25,.25v1.5c0,.138-.112,.25-.25,.25H2.75Z"
          fill="currentColor"
        />
        <path
          d="M17.78,13.22c-.293-.293-.768-.293-1.061,0l-1.22,1.22v-3.189c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v3.189l-1.22-1.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.5,2.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.5-2.5c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default boxArchiveDownload;
