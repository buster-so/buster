import React from 'react';

import type { iconProps } from './iconProps';

function refreshAnticlockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px refresh anticlockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.75,7.5h-3c-.414,0-.75.336-.75.75s.336.75.75.75h1.606c-.839.944-2.045,1.5-3.356,1.5-2.431,0-4.405-1.901-4.497-4.328-.015-.414-.367-.73-.777-.721-.414.016-.736.364-.721.778.121,3.236,2.755,5.771,5.995,5.771,1.517,0,2.922-.565,4-1.534v.784c0,.414.336.75.75.75s.75-.336.75-.75v-3c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,0c-1.517,0-2.922.565-4,1.534v-.784c0-.414-.336-.75-.75-.75s-.75.336-.75.75v3c0,.414.336.75.75.75h3c.414,0,.75-.336.75-.75s-.336-.75-.75-.75h-1.606c.839-.944,2.045-1.5,3.356-1.5,2.431,0,4.405,1.901,4.497,4.328.015.404.348.722.748.722.01,0,.02,0,.029,0,.414-.016.736-.364.721-.778-.121-3.236-2.755-5.771-5.995-5.771Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default refreshAnticlockwise;
