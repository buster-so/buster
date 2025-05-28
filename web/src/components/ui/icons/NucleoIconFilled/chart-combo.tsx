import React from 'react';

import type { iconProps } from './iconProps';

function chartCombo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart combo';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,11.5c-.414,0-.75,.336-.75,.75v3c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M14.75,7c-.414,0-.75,.336-.75,.75v7.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V7.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M14.75,1c-1.24,0-2.25,1.009-2.25,2.25,0,.25,.05,.486,.126,.71l-2.422,1.896c-.349-.223-.76-.356-1.204-.356-.626,0-1.192,.258-1.601,.673l-1.936-1.063c.019-.118,.036-.237,.036-.36,0-1.241-1.01-2.25-2.25-2.25S1,3.509,1,4.75s1.01,2.25,2.25,2.25c.573,0,1.092-.222,1.489-.577l2.032,1.116c-.007,.07-.021,.138-.021,.211,0,1.241,1.01,2.25,2.25,2.25s2.25-1.009,2.25-2.25c0-.25-.05-.485-.126-.71l2.422-1.896c.349,.222,.76,.356,1.203,.356,1.24,0,2.25-1.009,2.25-2.25s-1.01-2.25-2.25-2.25Z"
          fill="currentColor"
        />
        <path
          d="M3.25,8.5c-.414,0-.75,.336-.75,.75v6c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-6c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chartCombo;
