import React from 'react';

import type { iconProps } from './iconProps';

function creditCardPen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px credit card pen';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,5.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v.75H17v-.75Z"
          fill="currentColor"
        />
        <path
          d="M9.999,14.847c.164-.406,.403-.768,.71-1.076l3.693-3.694c.553-.554,1.301-.858,2.104-.858,.166,0,.33,.021,.493,.048v-1.267H1v4.25c0,1.517,1.233,2.75,2.75,2.75h6.187l.062-.153Zm-2.749-2.847h-3c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M17.562,11.143c-.563-.563-1.538-.566-2.098-.005l-3.693,3.694c-.164,.164-.292,.358-.38,.577l-.63,1.561c-.112,.277-.048,.595,.162,.808,.144,.146,.337,.223,.534,.223,.092,0,.184-.017,.272-.051l1.515-.59c.227-.088,.429-.221,.602-.393l3.725-3.725c.281-.282,.434-.654,.432-1.05-.002-.395-.158-.767-.438-1.047Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default creditCardPen;
