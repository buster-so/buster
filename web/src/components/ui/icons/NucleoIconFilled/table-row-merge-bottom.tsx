import React from 'react';

import type { iconProps } from './iconProps';

function tableRowMergeBottom(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table row merge bottom';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.707,15.132c.153-.382-.034-.821-.419-.974-.479-.191-.788-.646-.788-1.158v-4H14.5v4c0,.513-.309,.967-.788,1.158-.386,.152-.572,.592-.419,.974,.153,.385,.589,.572,.974,.419,1.053-.419,1.733-1.42,1.733-2.551V4.75c0-1.517-1.233-2.75-2.75-2.75H4.75c-1.517,0-2.75,1.233-2.75,2.75V13c0,1.131,.68,2.132,1.733,2.551,.385,.153,.821-.034,.974-.419Z"
          fill="currentColor"
        />
        <path
          d="M9.53,17.78l2.5-2.5c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-1.22,1.22v-3.689c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v3.689l-1.22-1.22c-.293-.293-.768-.293-1.061,0-.146,.146-.22,.338-.22,.53s.073,.384,.22,.53l2.5,2.5c.293,.293,.768,.293,1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableRowMergeBottom;
