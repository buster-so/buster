import type { iconProps } from './iconProps';

function gridEmptyObjBottomRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid empty obj bottom right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="5"
          width="5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.25"
          y="2.25"
        />
        <rect
          height="5"
          width="5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.25"
          y="10.75"
        />
        <rect
          height="5"
          width="5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="10.75"
          y="2.25"
        />
        <path
          d="M10.75,12v-.25c0-.552,.448-1,1-1h.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12,15.75h-.25c-.552,0-1-.448-1-1v-.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,14.5v.25c0,.552-.448,1-1,1h-.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.5,10.75h.25c.552,0,1,.448,1,1v.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default gridEmptyObjBottomRight;
