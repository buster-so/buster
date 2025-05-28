import React from 'react';

import type { iconProps } from './iconProps';

function medal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px medal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.033,8.917L1.204,2.507c-.2-.333,.04-.757,.429-.757h3.084c.176,0,.338,.092,.429,.243l2.906,4.853"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.986,8.917l3.81-6.41c.2-.333-.04-.757-.429-.757h-3.084c-.176,0-.338,.092-.429,.243l-2.906,4.853"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.476,10.693c-.059-.181-.216-.312-.403-.34l-1.122-.163-.502-1.017c-.168-.342-.729-.342-.896,0l-.502,1.017-1.122,.163c-.188,.027-.345,.159-.403,.34-.059,.181-.01,.38,.127,.513l.812,.792-.192,1.118c-.032,.188,.045,.377,.199,.489,.154,.112,.358,.126,.526,.038l1.004-.527,1.004,.527c.073,.039,.152,.058,.232,.058,.104,0,.207-.032,.294-.096,.154-.112,.231-.301,.199-.489l-.192-1.118,.812-.792c.137-.133,.186-.332,.127-.513Z"
          fill="currentColor"
        />
        <circle
          cx="9"
          cy="11.5"
          fill="none"
          r="4.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default medal;
