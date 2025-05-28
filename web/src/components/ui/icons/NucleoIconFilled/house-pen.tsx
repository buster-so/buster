import React from 'react';

import type { iconProps } from './iconProps';

function housePen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house pen';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.369,16.406l.63-1.56c.164-.406,.403-.768,.71-1.076l3.693-3.694c.434-.435,.99-.709,1.597-.81v-2.271c0-.543-.258-1.064-.691-1.394L10.059,1.613c-.624-.475-1.495-.474-2.118,0L2.691,5.603s0,0,0,0c-.433,.329-.691,.85-.691,1.393v7.254c0,1.517,1.233,2.75,2.75,2.75h4.475c.023-.2,.066-.401,.144-.594Z"
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

export default housePen;
