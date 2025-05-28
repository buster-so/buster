import React from 'react';

import type { iconProps } from './iconProps';

function archivePencil(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px archive pencil';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m15.25,7.2642c-.4141,0-.75.3359-.75.75v1.4858h-2.75c-.4141,0-.75.3359-.75.75v1.5c0,.1377-.1123.25-.25.25h-3.5c-.1377,0-.25-.1123-.25-.25v-1.5c0-.4141-.3359-.75-.75-.75h-2.75v-4.75c0-.6895.5605-1.25,1.25-1.25h5.2349c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75h-5.2349c-1.5161,0-2.75,1.2334-2.75,2.75v8.5c0,1.5166,1.2334,2.75,2.75,2.75h8.5c1.5166,0,2.75-1.2334,2.75-2.75v-5.2358c0-.4141-.3359-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m17.3115.6885c-.563-.563-1.5376-.5664-2.0981-.0054l-3.6934,3.6938c-.1641.1641-.292.3579-.3804.5771l-.6304,1.5605c-.1123.2773-.0483.5947.1616.8076.1436.1455.3369.2231.5337.2231.0918,0,.1841-.0166.2725-.0513l1.5146-.5903c.2271-.0884.4292-.2207.6016-.3931l3.7246-3.7251c.2808-.2817.4341-.6543.4321-1.0498-.002-.3945-.1577-.7666-.4385-1.0474Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default archivePencil;
