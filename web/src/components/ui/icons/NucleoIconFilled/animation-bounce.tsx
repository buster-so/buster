import React from 'react';

import type { iconProps } from './iconProps';

function animationBounce(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px animation bounce';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="13.75" cy="6.25" fill="currentColor" r="3.25" />
        <path
          d="M8.52,7.174c-.919,.766-1.695,1.671-2.308,2.689-.128,.212-.248,.429-.36,.65-.251-1.15-.619-2.27-1.104-3.352-.625-1.393-1.438-2.702-2.419-3.889-.265-.321-.738-.364-1.056-.101-.319,.264-.364,.736-.101,1.056,.894,1.083,1.637,2.277,2.206,3.548,.91,2.028,1.372,4.207,1.372,6.474,0,.397,.311,.726,.707,.749,.015,0,.029,0,.044,0,.378,0,.701-.284,.744-.665,.149-1.307,.582-2.585,1.252-3.699,.526-.875,1.193-1.652,1.983-2.31,.318-.265,.361-.738,.096-1.056-.266-.32-.739-.361-1.057-.096Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default animationBounce;
