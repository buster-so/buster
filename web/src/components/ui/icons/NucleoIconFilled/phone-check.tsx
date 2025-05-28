import React from 'react';

import type { iconProps } from './iconProps';

function phoneCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px phone check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.401,1.548l-2.896,3.836-1-.933c-.303-.281-.777-.267-1.061,.038-.282,.303-.266,.777,.037,1.06l1.609,1.5c.14,.13,.322,.201,.512,.201,.021,0,.043,0,.065-.003,.211-.019,.405-.125,.533-.295l3.397-4.5c.249-.331,.184-.801-.146-1.051-.332-.25-.802-.183-1.051,.146Z"
          fill="currentColor"
        />
        <path
          d="M15.479,11.232l-2.926-1.299c-.713-.317-1.551-.114-2.04,.494l-1.367,1.701c-1.307-.854-2.423-1.971-3.277-3.28l1.705-1.358c.609-.488,.813-1.327,.497-2.04l-1.3-2.928c-.343-.772-1.185-1.178-2.004-.967l-2.476,.643c-.846,.22-1.393,1.04-1.273,1.907,.934,6.649,6.229,11.945,12.88,12.879,.08,.011,.158,.016,.236,.016,.774,0,1.468-.522,1.669-1.29l.642-2.476c.211-.817-.195-1.659-.966-2.002Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default phoneCheck;
