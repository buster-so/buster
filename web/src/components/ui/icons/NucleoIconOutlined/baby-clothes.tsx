import React from 'react';

import type { iconProps } from './iconProps';

function babyClothes(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px baby clothes';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.491,7.353l.759-.603-1.78-2.769c-.3-.466-.779-.787-1.325-.886l-1.662-.302c-.088,1.301-1.16,2.333-2.483,2.333-1.323,0-2.395-1.031-2.483-2.333l-1.662,.302c-.545,.099-1.025,.42-1.325,.886l-1.78,2.769,.759,.603"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25,6.75c-.104,.757-.179,1.617-.187,2.563-.01,1.098,.07,2.086,.188,2.937-.2,0-1.262,.02-2.121,.879-.543,.543-.879,1.293-.879,2.121h-1.25s-1.25,0-1.25,0c0-.828-.336-1.578-.879-2.121-.859-.859-1.922-.879-2.121-.879,.117-.852,.198-1.84,.188-2.938-.009-.946-.083-1.806-.188-2.562"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.866,10.506c.085,.044,.184,.044,.269,0,.449-.23,1.866-1.064,1.866-2.421,.002-.596-.487-1.081-1.093-1.085-.365,.005-.704,.185-.907,.484-.203-.298-.542-.479-.907-.484-.606,.004-1.095,.489-1.093,1.085,0,1.357,1.417,2.191,1.866,2.421Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default babyClothes;
