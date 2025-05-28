import React from 'react';

import type { iconProps } from './iconProps';

function textColor2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text color 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.5,17c-1.93,0-3.5-1.574-3.5-3.509,0-1.866,1.021-2.929,2.007-3.958,.304-.316,.617-.642,.909-1.004,.285-.354,.883-.354,1.168,0,.292,.362,.605,.688,.909,1.004,.986,1.028,2.007,2.091,2.007,3.958,0,1.935-1.57,3.509-3.5,3.509Z"
          fill="currentColor"
        />
        <path
          d="M11.314,8.185l-2.214-5.707c-.112-.289-.39-.479-.699-.479h-.803c-.31,0-.587,.19-.699,.479L3.417,11.458s0,0,0,0l-1.365,3.52c-.149,.386,.042,.82,.428,.97,.09,.035,.181,.051,.271,.051,.301,0,.584-.182,.699-.479l1.172-3.021h3.872c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-3.29l2.797-7.211,1.916,4.939c.149,.386,.583,.577,.971,.428,.386-.15,.577-.584,.428-.971Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default textColor2;
