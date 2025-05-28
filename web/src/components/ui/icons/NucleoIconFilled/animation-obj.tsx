import React from 'react';

import type { iconProps } from './iconProps';

function animationObj(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px animation obj';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.823,9.884c-.236-.236-.366-.55-.366-.884s.13-.647,.366-.884l3.775-3.775c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0L1.763,7.056c-.52,.519-.806,1.209-.806,1.944s.286,1.425,.806,1.944l3.775,3.775c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-3.775-3.775Z"
          fill="currentColor"
        />
        <path
          d="M16.245,7.056l-3.422-3.422c-1.04-1.04-2.853-1.038-3.889,0l-3.422,3.422c-.52,.519-.806,1.209-.806,1.944s.286,1.425,.806,1.944l3.422,3.422c.519,.519,1.209,.805,1.944,.805s1.425-.286,1.944-.805l3.422-3.422c1.071-1.072,1.071-2.816,0-3.889Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default animationObj;
