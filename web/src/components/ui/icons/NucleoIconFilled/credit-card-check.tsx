import React from 'react';

import type { iconProps } from './iconProps';

function creditCardCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px credit card check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,5.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v.75H17v-.75Z"
          fill="currentColor"
        />
        <path
          d="M9.995,14.829c-.021-.601,.193-1.174,.604-1.614,.424-.454,1.023-.714,1.645-.714,.472,0,.926,.146,1.305,.417l1.905-2.523c.374-.492,.939-.794,1.546-.864v-1.53H1v4.25c0,1.517,1.233,2.75,2.75,2.75h6.268c-.006-.058-.021-.113-.023-.171Zm-2.745-2.829h-3c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.651,11.298l-2.896,3.836-1-.932c-.302-.282-.777-.266-1.06,.037s-.266,.777,.037,1.06l1.609,1.5c.139,.13,.322,.202,.511,.202,.021,0,.043,0,.065-.003,.212-.019,.406-.125,.534-.295l3.397-4.5c.25-.331,.184-.801-.146-1.051-.331-.249-.801-.183-1.051,.146Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default creditCardCheck;
