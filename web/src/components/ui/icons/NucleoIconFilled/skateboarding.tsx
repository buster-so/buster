import React from 'react';

import type { iconProps } from './iconProps';

function skateboarding(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px skateboarding';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="12.5" cy="3" fill="currentColor" r="2" />
        <circle cx="8.75" cy="16.75" fill="currentColor" r=".75" />
        <circle cx="12.75" cy="16.75" fill="currentColor" r=".75" />
        <path
          d="M2.749,13.25c-.381,0-.707-.289-.745-.675-.041-.412,.26-.78,.672-.821l2.017-.202c.076-.008,.145-.05,.186-.115l.389-.61c.224-.349,.686-.452,1.036-.23,.349,.223,.452,.686,.229,1.036l-.389,.61c-.291,.456-.765,.748-1.302,.801l-2.018,.202c-.025,.003-.05,.004-.075,.004Z"
          fill="currentColor"
        />
        <path
          d="M10.384,9.803l-.993-.386,1.425-1.861c.443-.578,.519-1.343,.196-1.996-.322-.654-.975-1.06-1.703-1.06H4.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.351l-.733,.958c-.434,.568-.572,1.288-.379,1.976,.193,.688,.686,1.23,1.352,1.489l2.001,.778c.097,.038,.159,.129,.159,.233v2.816c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.816c0-.728-.438-1.368-1.116-1.631Z"
          fill="currentColor"
        />
        <path
          d="M14.25,15h-6.25c-.519,0-1.007-.228-1.339-.624-.267-.317-.225-.791,.093-1.057,.313-.265,.79-.225,1.056,.093,.047,.056,.116,.088,.19,.088h6.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default skateboarding;
