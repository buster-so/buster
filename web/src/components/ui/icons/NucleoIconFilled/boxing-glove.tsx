import React from 'react';

import type { iconProps } from './iconProps';

function boxingGlove(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px boxing glove';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,1.5H6.75c-1.982,0-3.593,1.551-3.725,3.5h2.475c1.302,0,2.402,.838,2.816,2h2.341c.698,0,1.363-.531,1.344-1.229-.012-.424,.329-.771,.75-.771,.414,0,.75,.336,.75,.75,0,1.517-1.233,2.75-2.75,2.75h-2.301c-.24,1.416-1.466,2.5-2.949,2.5h-.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.75c.827,0,1.5-.673,1.5-1.5s-.673-1.5-1.5-1.5h-1.75c-1.243,0-2.25,1.007-2.25,2.25h0v1.5c0,1.982,1.55,3.593,3.5,3.725v1.275c0,.966,.784,1.75,1.75,1.75h5.5c.966,0,1.75-.784,1.75-1.75v-1.5c0-.065-.021-.123-.037-.184,1.204-.625,2.037-1.869,2.037-3.316V5.25c0-2.071-1.679-3.75-3.75-3.75Zm.25,13.75c0,.138-.112,.25-.25,.25H6.75c-.138,0-.25-.112-.25-.25v-1.25h5.75c.086,0,.166-.02,.25-.025v1.275Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default boxingGlove;
