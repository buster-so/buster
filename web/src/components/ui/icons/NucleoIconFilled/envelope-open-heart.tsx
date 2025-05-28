import React from 'react';

import type { iconProps } from './iconProps';

function envelopeOpenHeart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px envelope open heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,7.25c0-.993-.532-1.878-1.421-2.369l-.712-.394c-.363-.202-.819-.069-1.019,.293-.201,.363-.069,.819,.293,1.019l.713,.394c.27,.149,.455,.371,.557,.628l-6.303,3.043c-.068,.033-.147,.032-.216,0L2.59,6.823c.102-.258,.287-.48,.557-.629l.712-.394c.362-.2,.494-.656,.293-1.019s-.658-.496-1.019-.293l-.712,.393c-.89,.491-1.422,1.377-1.422,2.37v6c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V7.252s0-.001,0-.002Z"
          fill="currentColor"
        />
        <path
          d="M8.731,8.183c.17,.089,.368,.089,.538,0,.897-.472,3.731-2.181,3.731-4.961,.004-1.221-.974-2.215-2.187-2.222-.73,.009-1.408,.38-1.813,.991-.405-.611-1.084-.981-1.813-.991-1.213,.007-2.191,1.002-2.187,2.222,0,2.78,2.834,4.489,3.731,4.961Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default envelopeOpenHeart;
