import React from 'react';

import type { iconProps } from './iconProps';

function circleQuestion(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle question';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm-.209,12.567c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Zm1.529-4.352c-.457,.319-.68,.491-.755,.915-.063,.364-.38,.62-.737,.62-.043,0-.087-.003-.131-.011-.408-.072-.681-.46-.608-.869,.186-1.057,.872-1.536,1.374-1.886,.527-.368,.71-.522,.71-1.049,0-.837-.698-1.058-1.067-1.058-.414,0-1.157,.13-1.477,1-.143,.389-.571,.588-.963,.446-.389-.143-.588-.574-.445-.962,.456-1.242,1.534-1.984,2.885-1.984,1.244,0,2.567,.896,2.567,2.558,0,1.337-.781,1.882-1.353,2.28Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleQuestion;
