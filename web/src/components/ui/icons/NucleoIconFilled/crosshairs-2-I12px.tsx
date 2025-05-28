import React from 'react';

import type { iconProps } from './iconProps';

function crosshairs2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px crosshairs 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.75,9.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.212c-.357-3.813-3.399-6.855-7.212-7.212V3.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V1.038c-3.813,.356-6.855,3.399-7.212,7.212H3.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H1.038c.357,3.813,3.399,6.855,7.212,7.212v-2.212c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.212c3.813-.356,6.855-3.399,7.212-7.212h-2.212Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default crosshairs2;
