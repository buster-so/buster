import React from 'react';

import type { iconProps } from './iconProps';

function heartHands(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart hands';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M17.25,16c-.141-1.25-.906-2.375-2.503-2.753"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25,7.181l-.957-2.192c-.123-.282-.33-.519-.592-.68l-2.099-1.284c-.256-.157-.554-.233-.854-.219l-1.437,.069c-.399,.019-.773,.196-1.041,.492l-1.079,1.193c-.268,.37-.251,.875,.04,1.227h0c.356,.43,.995,.487,1.421,.127l.598-.557,1.234,.132c.26,.028,.501,.151,.664,.356,.437,.549,1.141,1.774,.392,3.351-.653,1.376-2.681,2.47-3.805,2.913-.581,.229-.873,.876-.669,1.467h0c.218,.632,.928,.975,1.54,.704,3.739-1.657,3.354-.24,5.646-1.782"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M.75,16c.141-1.25,.906-2.375,2.503-2.753"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M.75,7.181l.957-2.192c.123-.282,.33-.519,.592-.68l2.099-1.284c.256-.157,.554-.233,.854-.219l1.437,.069c.399,.019,.773,.196,1.041,.492l1.079,1.193c.268,.37,.251,.875-.04,1.227h0c-.356,.43-.995,.487-1.421,.127l-.598-.557-1.234,.132c-.26,.028-.501,.151-.664,.356-.437,.549-1.141,1.774-.392,3.351,.653,1.376,2.681,2.47,3.805,2.913,.581,.229,.873,.876,.669,1.467h0c-.218,.632-.928,.975-1.54,.704-3.739-1.657-3.354-.24-5.646-1.782"
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

export default heartHands;
