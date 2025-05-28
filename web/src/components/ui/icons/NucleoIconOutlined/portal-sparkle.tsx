import React from 'react';

import type { iconProps } from './iconProps';

function portalSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px portal sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.295,9.999c-.965,.552-1.545,1.246-1.545,2.001,0,1.795,3.246,3.25,7.25,3.25s7.25-1.455,7.25-3.25c0-1.742-3.059-3.159-6.898-3.242"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.657,7.006l-1.262-.424-.421-1.272c-.137-.411-.812-.411-.949,0l-.421,1.272-1.262,.424c-.204,.068-.342,.261-.342,.477s.138,.409,.342,.477l1.262,.424,.421,1.272c.068,.205,.26,.344,.475,.344s.406-.139,.475-.344l.421-1.272,1.262-.424c.204-.068,.342-.261,.342-.477s-.138-.409-.342-.477h0Z"
          fill="currentColor"
        />
        <path
          d="M14.589,3.406l-1.515-.51-.505-1.526c-.164-.493-.975-.493-1.139,0l-.505,1.526-1.515,.51c-.245,.082-.41,.313-.41,.573s.165,.491,.41,.573l1.515,.51,.505,1.526c.082,.247,.312,.413,.57,.413s.487-.166,.57-.413l.505-1.526,1.515-.51c.245-.082,.41-.313,.41-.573s-.165-.49-.41-.573h0Z"
          fill="currentColor"
        />
        <circle cx="8.75" cy="11.75" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default portalSparkle;
