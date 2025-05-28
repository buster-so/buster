import React from 'react';

import type { iconProps } from './iconProps';

function arrowBoldLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,6h-5.25v-1.993c0-.478-.266-.907-.694-1.12-.427-.212-.93-.165-1.311,.124L1.414,8.004c-.314,.238-.494,.601-.494,.996s.18,.757,.494,.996l6.581,4.993c.223,.169,.487,.255,.754,.255,.188,0,.38-.043,.557-.131,.429-.213,.694-.642,.694-1.12v-1.993h5.25c.965,0,1.75-.785,1.75-1.75v-2.5c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowBoldLeft;
