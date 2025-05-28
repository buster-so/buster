import React from 'react';

import type { iconProps } from './iconProps';

function circleUserSparkle2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle user sparkle 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,11.5c-2.027,0-3.828,1.313-4.476,3.196,1.233,.97,2.785,1.554,4.476,1.554s3.242-.583,4.475-1.553c-.657-1.891-2.453-3.197-4.475-3.197Z"
          fill="currentColor"
        />
        <path
          d="M9,17c-4.411,0-8-3.589-8-8S4.589,1,9,1c.551,0,1.106,.058,1.652,.173,.405,.085,.665,.483,.58,.888-.086,.405-.49,.667-.889,.58-.444-.093-.896-.141-1.344-.141-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5,6.5-2.916,6.5-6.5c0-.46-.052-.929-.154-1.395-.089-.404,.167-.805,.571-.894,.402-.091,.804,.167,.894,.571,.126,.571,.189,1.149,.189,1.717,0,4.411-3.589,8-8,8Z"
          fill="currentColor"
        />
        <path
          d="M17.589,2.388l-1.515-.506-.505-1.515c-.164-.49-.975-.49-1.139,0l-.505,1.515-1.515,.506c-.245,.081-.41,.311-.41,.569s.165,.488,.41,.569l1.515,.506,.505,1.515c.082,.245,.312,.41,.57,.41s.487-.165,.57-.41l.505-1.515,1.515-.506c.245-.081,.41-.311,.41-.569s-.165-.487-.41-.569h0Z"
          fill="currentColor"
        />
        <circle cx="9" cy="7.75" fill="currentColor" r="2.75" />
      </g>
    </svg>
  );
}

export default circleUserSparkle2;
