import React from 'react';

import type { iconProps } from './iconProps';

function dress(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dress';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.648,7c.383-.993,.852-2.548,.852-4.25V1c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.042c-1.448,.153-2.433,.723-3,1.174-.567-.451-1.552-1.021-3-1.174V1c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75c0,1.702,.469,3.257,.852,4.25h7.296Z"
          fill="currentColor"
        />
        <path
          d="M4.822,8.5c-1.022,1.359-2.322,3.749-2.322,7.172,0,.361,.257,.671,.612,.737,1.669,.312,3.375,.591,5.888,.591s4.218-.279,5.888-.591c.355-.066,.612-.376,.612-.737,0-3.423-1.3-5.813-2.322-7.172H4.822Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default dress;
