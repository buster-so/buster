import React from 'react';

import type { iconProps } from './iconProps';

function key(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px key';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.497,2.075c0-.207-.086-.404-.237-.545-.151-.142-.355-.211-.56-.202l-2.847,.177c-.183,.011-.354,.089-.484,.218L6.77,7.323c-.269-.049-.52-.073-.77-.073-2.619,0-4.75,2.131-4.75,4.75s2.131,4.75,4.75,4.75,4.75-2.131,4.75-4.75c0-.262-.026-.526-.081-.811l1.619-1.667c.136-.14,.212-.327,.212-.522v-1.5h1.5c.19,0,.374-.073,.513-.203l1.753-1.645c.151-.142,.237-.341,.237-.548l-.006-3.029ZM5.5,13.5c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default key;
