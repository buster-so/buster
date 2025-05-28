import React from 'react';

import type { iconProps } from './iconProps';

function userShortHair2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user short hair 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,11c2.481,0,4.5-2.019,4.5-4.5s-2.019-4.5-4.5-4.5-4.5,2.019-4.5,4.5,2.019,4.5,4.5,4.5Zm0-1.5c-1.654,0-3-1.346-3-3,0-.018,.005-.034,.005-.052,.244,.033,.492,.052,.745,.052,1.775,0,3.356-.808,4.41-2.073,.518,.54,.84,1.268,.84,2.073,0,1.654-1.346,3-3,3Z"
          fill="currentColor"
        />
        <path
          d="M9,12c-2.413,0-4.672,1.078-6.2,2.957-.306,.376-.365,.883-.156,1.323,.212,.444,.647,.72,1.137,.72H14.219c.49,0,.925-.276,1.137-.72,.209-.44,.15-.947-.156-1.323-1.528-1.879-3.788-2.957-6.2-2.957Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userShortHair2;
