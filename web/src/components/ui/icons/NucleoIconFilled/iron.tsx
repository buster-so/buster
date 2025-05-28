import React from 'react';

import type { iconProps } from './iconProps';

function iron(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px iron';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,15.5H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h14.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.921,11.915l-1.046-2.091c-1.024-2.049-2.994-3.427-5.269-3.688l-7.368-.86,.045-.427c.035-.335,.2-.636,.464-.847,.265-.21,.591-.307,.929-.264l4.828,.585c.401,.046,.784-.243,.834-.654s-.243-.785-.654-.835l-4.827-.585c-.736-.09-1.464,.117-2.044,.58s-.943,1.125-1.021,1.863l-.787,7.479c-.022,.211,.047,.422,.188,.581,.143,.158,.345,.248,.558,.248h14.5c.26,0,.501-.135,.638-.356,.137-.221,.149-.497,.033-.729Zm-10.921-1.415c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm4,0c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default iron;
