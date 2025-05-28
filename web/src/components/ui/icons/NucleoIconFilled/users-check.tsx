import React from 'react';

import type { iconProps } from './iconProps';

function usersCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12,1.75c-.5,0-.965,.135-1.38,.352,.547,.745,.88,1.655,.88,2.648s-.333,1.903-.88,2.648c.415,.217,.88,.352,1.38,.352,1.654,0,3-1.346,3-3s-1.346-3-3-3Z"
          fill="currentColor"
        />
        <path
          d="M9.959,15.396c-.439-.409-.693-.966-.714-1.567s.193-1.174,.604-1.614c.422-.454,1.022-.715,1.645-.715,.264,0,.519,.056,.762,.145-1.142-1.795-3.097-2.895-5.255-2.895-2.369,0-4.505,1.315-5.575,3.432-.282,.557-.307,1.213-.069,1.801,.246,.607,.741,1.079,1.358,1.293,1.384,.48,2.826,.724,4.286,.724,1.076,0,2.142-.135,3.183-.396l-.223-.208Z"
          fill="currentColor"
        />
        <path
          d="M13.103,16c-.189,0-.372-.071-.511-.202l-1.609-1.5c-.303-.282-.32-.757-.037-1.06,.282-.303,.757-.319,1.06-.037l1,.932,2.896-3.836c.25-.33,.72-.396,1.051-.146,.331,.25,.396,.72,.146,1.051l-3.397,4.5c-.128,.169-.322,.276-.534,.295-.021,.002-.043,.003-.065,.003Z"
          fill="currentColor"
        />
        <circle cx="7" cy="4.75" fill="currentColor" r="3" />
      </g>
    </svg>
  );
}

export default usersCheck;
