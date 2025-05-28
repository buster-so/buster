import React from "react";

import type { iconProps } from "./iconProps";

function mediaStop(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px media stop";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="14"
          width="14"
          fill="currentColor"
          rx="2.75"
          ry="2.75"
          x="2"
          y="2"
        />
      </g>
    </svg>
  );
}

export default mediaStop;
