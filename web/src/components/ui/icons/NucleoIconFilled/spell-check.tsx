import React from 'react';

import type { iconProps } from './iconProps';

function spellCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px spell check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.75,16c-.09,0-.182-.016-.271-.051-.386-.15-.578-.584-.428-.97L7.899,2.479c.112-.289,.39-.479,.699-.479h.803c.31,0,.587,.19,.699,.479l3.491,9c.089,.23,.06,.491-.081,.695-.14,.204-.371,.326-.619,.326H5.621l-1.172,3.021c-.115,.297-.399,.479-.699,.479Zm2.453-5h5.594l-2.797-7.211-2.797,7.211Z"
          fill="currentColor"
        />
        <path
          d="M12.853,17c-.198,0-.389-.079-.53-.22l-1.609-1.609c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.005,1.005,2.877-3.74c.252-.329,.723-.389,1.052-.137,.328,.252,.39,.723,.137,1.052l-3.397,4.417c-.131,.171-.33,.277-.545,.291-.017,0-.033,.001-.049,.001Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default spellCheck;
