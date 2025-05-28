import React from 'react';

import type { iconProps } from './iconProps';

function ironDoNot(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px iron do not';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,15.5H6.812c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h9.438c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.875,9.823c-.494-.989-1.212-1.816-2.075-2.442l-5.619,5.619h8.068c.26,0,.501-.135,.638-.356,.137-.221,.149-.497,.033-.729l-1.046-2.091Z"
          fill="currentColor"
        />
        <path
          d="M1.75,13h3.25l6.651-6.651c-.34-.094-.687-.172-1.044-.213l-7.368-.86,.045-.427c.035-.335,.2-.636,.464-.847,.265-.21,.591-.307,.929-.264l4.828,.585c.401,.046,.784-.243,.834-.654s-.243-.785-.654-.835l-4.827-.585c-.736-.09-1.464,.117-2.044,.58s-.943,1.125-1.021,1.863l-.787,7.479c-.022,.211,.047,.422,.188,.581,.143,.158,.345,.248,.558,.248Zm4.25-4.5c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1Z"
          fill="currentColor"
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default ironDoNot;
