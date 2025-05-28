import React from 'react';

import type { iconProps } from './iconProps';

function mapCursor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px map cursor';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.25,9.978V4.997c0-.64-.592-1.115-1.217-.976l-2.998,.666c-.186,.041-.38,.029-.559-.036l-4.952-1.801c-.179-.065-.373-.078-.559-.036l-3.432,.763c-.458,.102-.783,.508-.783,.976V13.003c0,.64,.592,1.115,1.217,.976l2.998-.666c.186-.041,.38-.029,.559,.036l2.761,1.004"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.126,10.768l5.94,2.17c.25,.091,.243,.448-.011,.529l-2.719,.87-.87,2.719c-.081,.254-.438,.261-.529,.011l-2.17-5.94c-.082-.223,.135-.44,.359-.359Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default mapCursor;
