import React from 'react';

import type { iconProps } from './iconProps';

function bagUser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bag user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="14.391" cy="11.75" fill="currentColor" r="1.75" />
        <path
          d="M9.681,15.856c.362-1.038,1.046-1.894,1.911-2.484-.279-.479-.451-1.029-.451-1.622,0-1.792,1.458-3.25,3.25-3.25,.428,0,.834,.088,1.209,.239l-.194-2.227c-.125-1.432-1.302-2.512-2.739-2.512h-.667v-1c0-1.654-1.346-3-3-3s-3,1.346-3,3v1h-.667c-1.437,0-2.615,1.08-2.739,2.512l-.652,7.5c-.067,.766,.193,1.53,.712,2.097s1.258,.892,2.027,.892h4.875c-.036-.383-.004-.772,.124-1.144ZM7.5,3c0-.827,.673-1.5,1.5-1.5s1.5,.673,1.5,1.5v1h-3v-1Z"
          fill="currentColor"
        />
        <path
          d="M17.682,16.346c-.488-1.403-1.811-2.346-3.291-2.346s-2.803,.943-3.292,2.346c-.13,.375-.068,.795,.164,1.122,.237,.333,.621,.532,1.027,.532h4.201c.406,0,.79-.199,1.027-.532,.232-.327,.294-.747,.163-1.123Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bagUser;
