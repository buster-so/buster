import React from 'react';

import type { iconProps } from './iconProps';

function contrast(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px contrast';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.657,3.343C11.538,.224,6.462,.224,3.343,3.343S.224,11.538,3.343,14.657c1.56,1.56,3.608,2.339,5.657,2.339s4.098-.78,5.657-2.339c3.119-3.119,3.119-8.194,0-11.313Zm-5.657,6.407h6.449c-.09,.777-.315,1.541-.683,2.25h-5.766v-2.25Zm0-1.5v-2.25h5.766c.369,.709,.594,1.473,.683,2.25h-6.449Zm4.597-3.846c.031,.031,.057,.065,.087,.096h-4.684v-1.997c1.664,0,3.329,.633,4.597,1.9Zm-4.597,11.093v-1.997h4.684c-.03,.031-.056,.065-.087,.096-1.267,1.267-2.932,1.9-4.597,1.9Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default contrast;
