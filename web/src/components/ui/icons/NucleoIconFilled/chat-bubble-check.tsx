import React from 'react';

import type { iconProps } from './iconProps';

function chatBubbleCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bubble check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.995,13.829c-.021-.601,.193-1.174,.604-1.614,.424-.454,1.023-.714,1.645-.714,.472,0,.926,.146,1.305,.417l1.905-2.523c.268-.353,.638-.602,1.046-.748v-3.896c0-1.517-1.233-2.75-2.75-2.75H4.25c-1.517,0-2.75,1.233-2.75,2.75v11.5c0,.288,.165,.551,.425,.676,.103,.05,.214,.074,.325,.074,.167,0,.333-.056,.469-.165l3.544-2.835h3.755c-.006-.058-.021-.113-.023-.171Z"
          fill="currentColor"
        />
        <path
          d="M16.651,10.298l-2.896,3.836-1-.932c-.303-.282-.777-.266-1.06,.037s-.266,.777,.037,1.06l1.609,1.5c.139,.13,.322,.202,.511,.202,.021,0,.043,0,.065-.003,.212-.019,.406-.125,.534-.295l3.397-4.5c.25-.331,.184-.801-.146-1.051-.331-.249-.801-.183-1.051,.146Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chatBubbleCheck;
