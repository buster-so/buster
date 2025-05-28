import React from 'react';

import type { iconProps } from './iconProps';

function cameraSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px camera sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15,7.458c-.905,0-1.706-.576-1.993-1.434l-.269-.806-.804-.269c-.856-.283-1.435-1.084-1.435-1.992,0-.346,.106-.665,.258-.958H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V7.177c-.303,.167-.638,.281-1,.281Zm-6,4.542c-1.657,0-3-1.343-3-3s1.343-3,3-3,3,1.343,3,3-1.343,3-3,3Z"
          fill="currentColor"
        />
        <path
          d="M17.589,2.388l-1.515-.506-.505-1.515c-.164-.49-.975-.49-1.139,0l-.505,1.515-1.515,.506c-.245,.081-.41,.311-.41,.569s.165,.488,.41,.569l1.515,.506,.505,1.515c.082,.245,.312,.41,.57,.41s.487-.165,.57-.41l.505-1.515,1.515-.506c.245-.081,.41-.311,.41-.569s-.165-.487-.41-.569h0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cameraSparkle;
