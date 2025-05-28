import React from 'react';

import type { iconProps } from './iconProps';

function slice(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px slice';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.242,16.038c-.345,0-.694-.013-1.048-.04-.292-.022-.545-.212-.647-.487-.102-.274-.035-.584,.173-.791L9.676,5.763c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L3.055,14.505c2.074-.152,3.909-.863,5.147-2.02l-.197-1.327c-.035-.235,.043-.473,.211-.641l1.546-1.546c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-1.279,1.279,.197,1.328c.034,.228-.039,.458-.197,.625-1.689,1.787-4.311,2.772-7.303,2.772Z"
          fill="currentColor"
        />
        <path
          d="M16.564,2.185c-.913-.912-2.398-.912-3.311,0l-3.578,3.578c-.293,.293-.293,.768,0,1.061l2.25,2.25c.141,.141,.331,.22,.53,.22s.39-.079,.53-.22l3.578-3.578c.913-.912,.913-2.397,0-3.311Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default slice;
