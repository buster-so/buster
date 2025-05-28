import React from 'react';

import type { iconProps } from './iconProps';

function download(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px download';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.053,13.252l-1.013-5.5c-.241-1.305-1.378-2.252-2.705-2.252h-2.585v5.189l1.72-1.72c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-3,3c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-3-3c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.72,1.72V5.5h-2.585c-1.327,0-2.464,.947-2.705,2.252l-1.013,5.5c-.148,.806,.067,1.628,.592,2.258,.524,.629,1.294,.99,2.113,.99H13.348c.819,0,1.589-.361,2.113-.99,.524-.629,.74-1.452,.592-2.258Z"
          fill="currentColor"
        />
        <path
          d="M9.75,5.5V1.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V5.5h1.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default download;
