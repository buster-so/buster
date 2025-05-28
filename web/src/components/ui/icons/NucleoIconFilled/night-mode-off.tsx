import React from 'react';

import type { iconProps } from './iconProps';

function nightModeOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px night mode off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.682,7.5h1.637c.077,.325,.13,.658,.156,1h-2.793l-1.5,1.5h4.233c-.049,.313-.113,.622-.205,.919-.643,.206-1.299,.331-1.96,.331-.969,0-1.88-.23-2.705-.613l-5.381,5.381c1.14,.625,2.447,.983,3.836,.983,4.411,0,8-3.589,8-8,0-1.389-.357-2.696-.983-3.836l-2.336,2.336Z"
          fill="currentColor"
        />
        <path
          d="M9.5,8.5h-1.55c-.223-.314-.416-.648-.581-1h3.131l1.5-1.5H6.873c-.064-.325-.098-.66-.111-1h6.237l1.654-1.654c-1.449-1.448-3.449-2.346-5.654-2.346C4.589,1,1,4.589,1,9c0,2.206,.897,4.206,2.346,5.654l6.154-6.154ZM7.08,2.79c.607-.188,1.252-.29,1.92-.29,1.267,0,2.447,.37,3.448,1H6.883c.048-.239,.122-.475,.197-.71Z"
          fill="currentColor"
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default nightModeOff;
