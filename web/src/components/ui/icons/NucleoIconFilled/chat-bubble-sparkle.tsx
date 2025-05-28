import React from 'react';

import type { iconProps } from './iconProps';

function chatBubbleSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bubble sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,13.25c0-.859,.478-1.631,1.246-2.014l1.327-.664,.664-1.329c.373-.747,1.145-1.21,2.013-1.21s1.64,.464,2.013,1.21l.237,.475V4.75c0-1.517-1.233-2.75-2.75-2.75H4.25c-1.517,0-2.75,1.233-2.75,2.75v11.5c0,.288,.165,.551,.425,.676,.104,.05,.215,.074,.325,.074,.167,0,.333-.056,.469-.165l3.544-2.835h2.88c-.084-.238-.143-.487-.143-.75Z"
          fill="currentColor"
        />
        <path
          d="M17.585,12.579l-1.776-.888-.888-1.776c-.254-.508-1.088-.508-1.342,0l-.888,1.776-1.776,.888c-.255,.127-.415,.387-.415,.671s.16,.544,.415,.671l1.776,.888,.888,1.776c.127,.254,.387,.415,.671,.415s.544-.161,.671-.415l.888-1.776,1.776-.888c.255-.127,.415-.387,.415-.671s-.16-.544-.415-.671Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chatBubbleSparkle;
