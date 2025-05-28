import React from 'react';

import type { iconProps } from './iconProps';

function boltLightning(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bolt lightning';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.868,6.191c-.213-.426-.642-.691-1.118-.691h-2.653l1.088-2.798c.149-.385,.099-.818-.134-1.159-.233-.34-.619-.543-1.031-.543H6.85c-.522,0-.994,.329-1.174,.819l-2.385,6.501c-.14,.383-.083,.812,.15,1.146,.234,.334,.617,.533,1.024,.533h3.79l-1.727,6.044c-.1,.348,.063,.717,.387,.878,.107,.053,.221,.078,.334,.078,.229,0,.454-.106,.6-.3L14.751,7.5c.285-.381,.33-.882,.117-1.309Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default boltLightning;
