import React from 'react';

import type { iconProps } from './iconProps';

function chatBubbleSmile(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bubble smile';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.75,2H4.25c-1.517,0-2.75,1.233-2.75,2.75v11.5c0,.288,.165,.551,.425,.676,.104,.05,.215,.074,.325,.074,.167,0,.333-.056,.469-.165l3.544-2.835h7.487c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-1.568,7.682c-.85,.85-1.979,1.318-3.182,1.318s-2.332-.468-3.182-1.318c-.293-.293-.293-.768,0-1.061,.294-.294,.769-.292,1.061,0,1.133,1.133,3.109,1.133,4.242,0,.293-.293,.768-.293,1.061,0,.293,.292,.293,.768,0,1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chatBubbleSmile;
