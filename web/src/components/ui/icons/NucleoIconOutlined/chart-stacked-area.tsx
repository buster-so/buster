import React from 'react';

import type { iconProps } from './iconProps';

function chartStackedArea(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart stacked area';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,11.25l2.954-2.045c.177-.123,.412-.118,.585,.011l3.484,2.613c.141,.106,.328,.13,.491,.062l6.987-2.891"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,14.25H3.75c-1.105,0-2-.895-2-2v-3.793c0-.133,.053-.26,.146-.354l2.809-2.809c.17-.17,.438-.195,.637-.058l3.374,2.319c.171,.117,.396,.117,.567,0L15.466,3.291c.332-.229,.784,.009,.784,.412V12.25c0,1.105-.895,2-2,2Z"
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

export default chartStackedArea;
