import React from 'react';

import type { iconProps } from './iconProps';

function envelopeOpen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px envelope open';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.578,4.382L9.846,1.218c-.529-.292-1.162-.292-1.691,0L2.422,4.382c-.891,.491-1.422,1.376-1.422,2.369v6.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V6.751c0-.993-.531-1.878-1.422-2.369ZM3.146,5.694l5.733-3.163c.076-.042,.166-.042,.242,0l5.732,3.163c.27,.149,.455,.371,.557,.628l-6.303,3.042c-.068,.033-.147,.033-.216,0L2.59,6.323c.101-.258,.286-.479,.557-.628h0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default envelopeOpen;
