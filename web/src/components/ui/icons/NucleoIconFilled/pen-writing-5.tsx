import React from 'react';

import type { iconProps } from './iconProps';

function penWriting5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pen writing 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M1.75,11h2.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M1.75,14h14.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,15.5H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h14.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M6.836,10.914h.013c.39-.006,2.381-.083,3.268-.97l5.25-5.25c.843-.844,.843-2.217,0-3.061-.819-.817-2.245-.816-3.061,0L7.056,6.884c-.887,.886-.963,2.878-.97,3.268-.003,.203,.076,.399,.22,.542,.141,.141,.332,.22,.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default penWriting5;
