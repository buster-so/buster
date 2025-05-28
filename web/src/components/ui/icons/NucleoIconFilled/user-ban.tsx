import React from 'react';

import type { iconProps } from './iconProps';

function userBan(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user ban';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M8.5,14c0-1.97,1.044-3.696,2.605-4.668-.671-.213-1.378-.332-2.105-.332-2.764,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.591,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.129,0,.258-.012,.387-.015-.559-.861-.887-1.885-.887-2.985Z"
          fill="currentColor"
        />
        <path
          d="M14,10c-2.206,0-4,1.794-4,4s1.794,4,4,4,4-1.794,4-4-1.794-4-4-4Zm0,1.5c.416,0,.802,.112,1.147,.292l-3.355,3.355c-.18-.345-.292-.732-.292-1.147,0-1.378,1.122-2.5,2.5-2.5Zm0,5c-.416,0-.802-.112-1.147-.292l3.355-3.355c.18,.345,.292,.732,.292,1.147,0,1.378-1.122,2.5-2.5,2.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userBan;
