import React from 'react';

import type { iconProps } from './iconProps';

function clothesHanger(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clothes hanger';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.014,10.5l4.51,3.266c.427,.309,.208,.984-.319,.984H2.795c-.527,0-.746-.675-.319-.984l6.524-4.724v-1.792c1.243,0,2.25-1.007,2.25-2.25s-1.007-2.25-2.25-2.25-2.25,1.007-2.25,2.25"
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

export default clothesHanger;
