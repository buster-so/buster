import React from 'react';

import type { iconProps } from './iconProps';

function style(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px style';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.657,7.006l-1.262-.424-.421-1.272c-.137-.411-.812-.411-.949,0l-.421,1.272-1.262,.424c-.204,.068-.342,.261-.342,.477s.138,.409,.342,.477l1.262,.424,.421,1.272c.068,.205,.26,.344,.475,.344s.406-.139,.475-.344l.421-1.272,1.262-.424c.204-.068,.342-.261,.342-.477s-.138-.409-.342-.477h0Z"
          fill="currentColor"
        />
        <path
          d="M10.25,2.75H4.75c-1.105,0-2,.896-2,2V13.25c0,1.104,.895,2,2,2H13.25c1.105,0,2-.896,2-2V7.708"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.589,2.388l-1.515-.506-.505-1.515c-.164-.49-.975-.49-1.139,0l-.505,1.515-1.515,.506c-.245,.081-.41,.311-.41,.569s.165,.488,.41,.569l1.515,.506,.505,1.515c.082,.245,.312,.41,.57,.41s.487-.165,.57-.41l.505-1.515,1.515-.506c.245-.081,.41-.311,.41-.569s-.165-.487-.41-.569h0Z"
          fill="currentColor"
        />
        <circle cx="11.75" cy="11.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default style;
