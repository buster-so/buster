import React from 'react';

import type { iconProps } from './iconProps';

function highDefinition(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px high definition';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.126,7.5h-1.123l-.002,3h1.124c.482,0,.874-.392,.874-.873v-1.253c0-.233-.09-.453-.254-.618-.166-.166-.386-.256-.619-.256Z"
          fill="currentColor"
        />
        <path
          d="M14.25,3H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V5.75c0-1.517-1.233-2.75-2.75-2.75Zm-5.753,8.25c0,.414-.336,.75-.75,.75-.415,0-.75-.336-.75-.75v-1.5s-1.996,0-1.996,0v1.5c0,.414-.337,.75-.751,.75-.415,0-.75-.336-.75-.75l.003-4.5c0-.414,.336-.75,.75-.75,.415,0,.75,.336,.75,.75v1.5s1.996,0,1.996,0v-1.5c0-.414,.337-.75,.751-.75,.415,0,.75,.336,.75,.75l-.003,4.5Zm6.002-1.623c0,1.308-1.065,2.372-2.374,2.372h-1.875c-.199,0-.39-.079-.53-.22-.141-.141-.22-.332-.22-.531l.003-4.5c0-.414,.336-.75,.75-.75h1.873c.635,0,1.231,.247,1.68,.696,.448,.449,.695,1.045,.694,1.68v1.252Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default highDefinition;
