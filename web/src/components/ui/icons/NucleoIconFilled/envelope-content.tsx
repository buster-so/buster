import React from 'react';

import type { iconProps } from './iconProps';

function envelopeContent(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px envelope content';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.648,6.615c-.219-.137-.491-.152-.725-.04l-6.816,3.29c-.068,.033-.147,.033-.216,0L2.076,6.575c-.232-.113-.506-.095-.725,.042s-.352,.379-.352,.637v5.996c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V7.25c0-.258-.133-.498-.352-.635Z"
          fill="currentColor"
        />
        <path
          d="M14.25,6.25c-.414,0-.75-.336-.75-.75V1.75c0-.138-.112-.25-.25-.25H4.75c-.138,0-.25,.112-.25,.25v3.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V1.75c0-.965,.785-1.75,1.75-1.75H13.25c.965,0,1.75,.785,1.75,1.75v3.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11.75,4.5H6.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11.75,7.5H6.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default envelopeContent;
