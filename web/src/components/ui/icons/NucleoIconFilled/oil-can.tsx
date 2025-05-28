import React from 'react';

import type { iconProps } from './iconProps';

function oilCan(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px oil can';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.86,7.314c-.201-.28-.564-.388-.883-.262l-5.139,2.011-.646-1.163c-.309-.555-.895-.9-1.53-.9H1.75c-.965,0-1.75,.785-1.75,1.75v1c0,1.517,1.233,2.75,2.75,2.75h.275c.129,1.398,1.294,2.5,2.725,2.5h5.072c.811,0,1.576-.355,2.1-.974l4.901-5.792c.222-.262,.237-.641,.037-.92ZM1.5,9.75v-1c0-.138,.112-.25,.25-.25h1.25v2.5h-.25c-.689,0-1.25-.561-1.25-1.25Z"
          fill="currentColor"
        />
        <path
          d="M4.25,4.5h1.75v.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default oilCan;
