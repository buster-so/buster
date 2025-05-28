import React from 'react';

import type { iconProps } from './iconProps';

function userBubbleCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user bubble check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.75,1c-2.895,0-5.25,2.354-5.25,5.249,0,.916,.244,1.822,.687,2.587,.079,.214-.091,1.005-.467,1.381-.209,.209-.276,.522-.17,.799s.365,.464,.66,.48c.054,.003,.109,.004,.165,.004,.709,0,1.538-.228,2.135-.508,.404,.191,.83,.331,1.271,.414,.318,.06,.644,.091,.969,.091,2.895,0,5.25-2.354,5.25-5.248S15.645,1,12.75,1Zm2.381,4.156l-2.25,3.5c-.123,.19-.325,.316-.551,.34-.027,.003-.054,.004-.08,.004-.198,0-.389-.078-.53-.22l-1.5-1.5c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l.842,.842,1.747-2.717c.224-.349,.688-.449,1.037-.225,.348,.224,.449,.688,.225,1.037Z"
          fill="currentColor"
        />
        <path
          d="M3.75,11.5c-2.068,0-3.75,1.682-3.75,3.75,0,.414,.336,.75,.75,.75H6.75c.414,0,.75-.336,.75-.75,0-2.068-1.682-3.75-3.75-3.75Z"
          fill="currentColor"
        />
        <circle cx="3.75" cy="8.25" fill="currentColor" r="2.25" />
      </g>
    </svg>
  );
}

export default userBubbleCheck;
