import React from 'react';

import type { iconProps } from './iconProps';

function objIncreaseSizeX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px obj increase size x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="14" width="10" fill="currentColor" rx="2.75" ry="2.75" x="4" y="2" />
        <path
          d="M17.758,8.489l-1.559-1.316h0c-.211-.178-.515-.223-.774-.113-.258,.11-.425,.355-.425,.624v2.632c0,.269,.167,.514,.425,.624,.258,.11,.562,.066,.774-.113l1.559-1.316c.154-.13,.243-.316,.243-.512s-.089-.382-.242-.511Z"
          fill="currentColor"
        />
        <path
          d="M2.575,7.06c-.258-.11-.562-.066-.774,.112h0S.242,8.489,.242,8.489c-.154,.129-.242,.316-.242,.511s.089,.382,.243,.512l1.559,1.316c.211,.178,.515,.223,.774,.113,.258-.11,.425-.355,.425-.624v-2.632c0-.269-.167-.514-.425-.624Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default objIncreaseSizeX;
