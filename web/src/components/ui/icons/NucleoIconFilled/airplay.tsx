import React from 'react';

import type { iconProps } from './iconProps';

function airplay(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px airplay';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.445,10.095c-.228,0-.453-.104-.601-.3-.249-.332-.181-.802.15-1.05.321-.241.505-.604.505-.995V3.25c0-.689-.561-1.25-1.25-1.25H2.75c-.689,0-1.25.561-1.25,1.25v4.5c0,.392.184.754.505.995.331.249.398.719.15,1.05-.249.331-.718.398-1.05.15-.702-.527-1.105-1.327-1.105-2.195V3.25C0,1.733,1.233.5,2.75.5h6.5c1.517,0,2.75,1.233,2.75,2.75v4.5c0,.868-.403,1.668-1.105,2.195-.135.101-.293.15-.45.15Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.047,10.398l-2.249-2.984c-.376-.499-1.222-.499-1.598,0l-2.249,2.984c-.229.305-.267.707-.096,1.048.17.341.513.554.895.554h4.497c.382,0,.725-.212.895-.554.17-.342.133-.743-.096-1.048Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default airplay;
