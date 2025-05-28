import React from 'react';

import type { iconProps } from './iconProps';

function suitcaseCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,5.5c-.414,0-.75-.336-.75-.75V2.25c0-.138-.112-.25-.25-.25h-3.5c-.138,0-.25,.112-.25,.25v2.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2.25c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M10.597,13.216c.422-.454,1.022-.716,1.646-.716,.472,0,.927,.146,1.306,.417l1.905-2.523c.37-.492,.937-.795,1.546-.865v-2.779c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h6.629c-.568-.849-.506-2.007,.218-2.784Z"
          fill="currentColor"
        />
        <path
          d="M16.651,11.298l-2.896,3.836-1-.933c-.303-.282-.778-.267-1.061,.038-.282,.303-.266,.777,.037,1.06l1.609,1.5c.14,.13,.322,.201,.512,.201,.021,0,.043,0,.065-.003,.211-.019,.405-.125,.533-.295l3.397-4.5c.249-.331,.184-.801-.146-1.051-.333-.25-.803-.183-1.051,.146Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default suitcaseCheck;
