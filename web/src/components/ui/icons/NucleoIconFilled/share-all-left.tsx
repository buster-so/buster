import React from 'react';

import type { iconProps } from './iconProps';

function shareAllLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share all left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11,6.051V3.543c0-.295-.173-.563-.443-.684-.269-.121-.584-.073-.805,.124L4.252,7.868c-.159,.141-.25,.343-.252,.555s.087,.416,.244,.559l5.5,5.029c.219,.202,.537,.251,.808,.133,.272-.12,.448-.389,.448-.687v-2.45c3.61,.322,5.634,2.88,5.654,2.905,.145,.189,.367,.294,.596,.294,.083,0,.166-.014,.246-.042,.306-.106,.509-.396,.504-.72,0-.072-.188-6.925-7-7.394Z"
          fill="currentColor"
        />
        <path
          d="M1.87,8.437L6.748,4.104c.31-.275,.338-.749,.062-1.059-.275-.31-.75-.339-1.059-.062L.252,7.868c-.159,.141-.25,.343-.252,.555s.087,.416,.244,.559l5.5,5.029c.144,.131,.325,.196,.506,.196,.203,0,.406-.082,.554-.244,.279-.306,.258-.78-.048-1.06L1.87,8.437Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shareAllLeft;
