import React from 'react';

import type { iconProps } from './iconProps';

function babyCarSeat(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px baby car seat';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.914,11.558c-.237-.958-1.01-1.731-1.97-1.971-.891-.223-1.799-.011-2.484,.583-.252,.219-.497,.33-.728,.33h-.508c-.129,1.536-1.406,2.75-2.975,2.75-1.654,0-3-1.346-3-3,0-1.454,1.04-2.668,2.415-2.941l-.481-2.979c-.239-1.497-1.652-2.519-3.15-2.281l-.987,.158c-.196,.032-.372,.14-.488,.301-.117,.161-.165,.362-.133,.559l1.552,9.619c.216,1.34,1.357,2.312,2.715,2.312h7.398c.97,0,1.798-.375,2.331-1.056,.516-.659,.7-1.551,.493-2.387Z"
          fill="currentColor"
        />
        <path
          d="M13.53,3.97c-.293-.293-.768-.293-1.061,0l-4.836,4.836c-.123-.033-.25-.056-.384-.056-.828,0-1.5,.672-1.5,1.5s.672,1.5,1.5,1.5,1.5-.672,1.5-1.5c0-.134-.023-.26-.056-.384l4.836-4.836c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default babyCarSeat;
