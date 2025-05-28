import React from 'react';

import type { iconProps } from './iconProps';

function boltLightningSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bolt lightning slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.466,10h3.534l4.5-4.5h-1.403l1.088-2.798c.149-.385,.099-.818-.134-1.159-.233-.34-.619-.543-1.031-.543H6.85c-.522,0-.994,.329-1.174,.819l-2.385,6.501c-.14,.383-.083,.812,.15,1.146,.234,.334,.617,.533,1.024,.533Z"
          fill="currentColor"
        />
        <path
          d="M7.086,14.096l-.557,1.948c-.1,.348,.063,.717,.387,.878,.107,.053,.221,.078,.334,.078,.229,0,.454-.106,.6-.3L14.751,7.5c.265-.354,.313-.812,.148-1.217l-7.813,7.813Z"
          fill="currentColor"
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default boltLightningSlash;
