import React from 'react';

import type { iconProps } from './iconProps';

function clockMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clock minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m16.25,14.5h-5c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9,1C4.5889,1,1,4.5889,1,9s3.5889,8,8,8c1.4012,0,2.7178-.3645,3.8644-1h-1.6144c-1.2407,0-2.25-1.0093-2.25-2.25s1.0093-2.25,2.25-2.25h5c.1137,0,.2228.0171.332.0337.2672-.7974.418-1.6475.418-2.5337,0-4.4111-3.5889-8-8-8Zm.75,8c0,.2461-.1206.4766-.3232.6167l-3.25,2.25c-.1299.0903-.2788.1333-.4263.1333-.2378,0-.4717-.1128-.6172-.3232-.2358-.3403-.1509-.8076.1899-1.0435l2.9268-2.0264v-3.8569c0-.4141.3359-.75.75-.75s.75.3359.75.75v4.25Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default clockMinus;
