import React from 'react';

import type { iconProps } from './iconProps';

function calendarBolt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px calendar bolt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.75,3.5c-.414,0-.75-.336-.75-.75V.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V2.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.25,3.5c-.414,0-.75-.336-.75-.75V.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V2.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,2H4.25c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h6.214c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.25c-.689,0-1.25-.561-1.25-1.25V7H15v1.718c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.968c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M17.404,13.384c-.132-.237-.383-.384-.654-.384h-1.876l.588-1.763c.12-.361-.05-.756-.395-.917-.344-.161-.756-.039-.956,.287l-2,3.25c-.143,.231-.148,.521-.016,.759,.132,.237,.383,.384,.654,.384h1.876l-.588,1.763c-.12,.361,.05,.756,.395,.917,.103,.048,.21,.07,.317,.07,.253,0,.498-.128,.639-.357l2-3.25c.143-.231,.148-.521,.016-.759Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default calendarBolt;
