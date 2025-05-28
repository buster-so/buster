import React from 'react';

import type { iconProps } from './iconProps';

function suitcase4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,5.5c-.414,0-.75-.336-.75-.75V2.25c0-.138-.112-.25-.25-.25h-3.5c-.138,0-.25,.112-.25,.25v2.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2.25c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,4H1.75c-.414,0-.75,.336-.75,.75v2.574c0,1.172,.745,2.217,1.854,2.6l5.902,2.035c.079,.027,.162,.041,.245,.041s.166-.014,.245-.041l5.902-2.035c1.109-.382,1.854-1.427,1.854-2.6v-2.574c0-.414-.336-.75-.75-.75Zm-7.25,5.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.635,11.342l-5.902,2.035c-.235,.082-.482,.123-.733,.123s-.498-.042-.735-.124l-5.9-2.035c-.31-.107-.595-.258-.865-.427v2.335c0,1.517,1.233,2.75,2.75,2.75H13.75c1.517,0,2.75-1.233,2.75-2.75v-2.335c-.27,.169-.554,.32-.865,.427Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default suitcase4;
