import React from 'react';

import type { iconProps } from './iconProps';

function dropdownSelect(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dropdown select';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.583,7.5h-2.5c-.158,0-.302,.089-.373,.23-.07,.141-.055,.31,.039,.436l1.25,1.667c.079,.105,.202,.167,.333,.167s.255-.062,.333-.167l1.25-1.667c.095-.126,.11-.295,.039-.436-.071-.141-.215-.23-.373-.23Z"
          fill="currentColor"
        />
        <path
          d="M6.126,10.768l5.94,2.17c.25,.091,.243,.448-.011,.529l-2.719,.87-.87,2.719c-.081,.254-.438,.261-.529,.011l-2.17-5.94c-.082-.223,.135-.44,.359-.359Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.75 4.75L9.75 9.43"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.574,12.25h.176c1.105,0,2-.896,2-2v-3.5c0-1.104-.895-2-2-2H3.25c-1.105,0-2,.896-2,2v3.5c0,1.104,.895,2,2,2h.266"
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

export default dropdownSelect;
