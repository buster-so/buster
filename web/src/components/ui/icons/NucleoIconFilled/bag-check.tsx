import React from 'react';

import type { iconProps } from './iconProps';

function bagCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bag check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.097,14.216c.424-.455,1.024-.716,1.646-.716,.473,0,.927,.146,1.306,.417l1.905-2.523c.217-.287,.5-.512,.818-.666l-.367-4.216c-.125-1.432-1.302-2.512-2.739-2.512h-.667v-1c0-1.654-1.346-3-3-3s-3,1.346-3,3v1h-.667c-1.437,0-2.615,1.08-2.739,2.512l-.652,7.5c-.067,.766,.193,1.53,.712,2.097s1.258,.892,2.027,.892h5.197c-.568-.849-.506-2.007,.218-2.784ZM7.5,3c0-.827,.673-1.5,1.5-1.5s1.5,.673,1.5,1.5v1h-3v-1Z"
          fill="currentColor"
        />
        <path
          d="M16.151,12.298l-2.896,3.836-1-.933c-.303-.282-.777-.267-1.061,.038-.282,.303-.266,.777,.037,1.06l1.609,1.5c.14,.13,.322,.201,.512,.201,.021,0,.043,0,.065-.003,.211-.019,.405-.125,.533-.295l3.397-4.5c.249-.331,.184-.801-.146-1.051-.333-.25-.802-.183-1.051,.146Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bagCheck;
